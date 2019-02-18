/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; js-indent-level: 2 -*- */

document.addEventListener('DOMContentLoaded', function onDocumentReady() {
  var exports = {}

  function buildJSO(client_id, auth, redirect) {
    return new JSO({
      client_id: client_id,
      authorization: auth,
      redirect_uri: redirect,
      debug: true,
    });
  }

  function playerUIDGetter() {
    return document.querySelector('#player_uid').value
  }

  function logRequestAsCurl(url, method, data, auth) {
    var requests_container = document.querySelector('#requests');
    var container = document.querySelector('#templates .request').cloneNode(true);
    requests_container.insertBefore(container, requests_container.firstChild);

    var curl = container.querySelector('.curl');
    var formargs = null;

    if (!!data) {
      var args = {};

      var isFormDataIterable = data.entries !== undefined;

      if (isFormDataIterable) {
        for (var pair of data) {
          var k = pair[0];
          var v = pair[1];

          if (v instanceof File) {
            if (!v.name) continue;

            v = '@' + v.name;
          }

          if (!v) continue;

          args[k] = v;
        }
      } else if (data._src !== undefined) {
        var form = data._src;
        var inputs = [
          form.querySelectorAll('input'),
          form.querySelectorAll('textarea')
        ];

        // flattern inputs
        inputs = inputs.reduce(function(a, i) {
          return a.concat(
            Array.prototype.reduce.call(i, function(_a, _i) {
              _a.push(_i);
              return _a;
            }, [])
          );
        }, []);

        // reduce array to name->value map
        args = inputs.reduce(function(a, i) {
          if (!i.name) return a;
          var value = i.value;
          if (!value) return a;

          if (i.type == 'file') {
            value = '@' + value.split('\\').pop();
          }

          a[i.name] = value;
          return a;
        }, {});
      } else {
        console.error('\_(O_o)_/');
      }

      // reduce name->value map to curl args string
      formargs = Object.keys(args).reduce(function(a, k) {
        var v = args[k];

        return a.concat(['-F', '"' + k + '=' + v +  '"']);
      }, []).join(' ');
    }

    var player_uid = playerUIDGetter();

    if (url.substring(0, 4) !== 'http') {
      url = window.location.origin + url;
    }

    curl.innerHTML = [
      'curl -i -X',
      method,
      '-H "Authorization: ' + auth + '"',
      !!player_uid ? '-H "X-PlayerUID: ' + player_uid + '"' : '',
      formargs,
      '"' + url + '"'
    ].filter(function(a){return !!a;}).join(' ');

    return container;
  }
  exports.logRequestAsCurl = logRequestAsCurl;

  function logResponseAsCurl(container, ev) {
    var rsp_container = document.createElement('div');

    var status_ok = ev.target.status >= 200 && ev.target.status < 300;

    var headers = container.querySelector('.response .headers')
    var text = document.createTextNode([
      ev.target.status + ' ' + ev.target.statusText,
      ev.target.getAllResponseHeaders(),
    ].join('\n'));
    headers.appendChild(text);
    headers.classList.add(status_ok ? 'status_ok' : 'status_bad');

    var content_type = ev.target.getResponseHeader('Content-Type');
    var body = container.querySelector('.response .body');

    if (ev.target.responseType == 'json' && content_type == 'application/json') {
      var json_body = document.createElement('pre');
      json_body.innerHTML = JSON.stringify(ev.target.response, null, 2);
      body.appendChild(json_body);
    } else if (ev.target.responseType == 'arraybuffer' && status_ok) {
      var content_type = ev.target.getResponseHeader('Content-Type');
      var filename = ev.target.getResponseHeader('Content-Disposition').split('=')[1];

      var arrayBufferView = new Uint8Array(ev.target.response);
      var blob = new Blob([arrayBufferView], {type: content_type});
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a = _applyNodeProps(a, {
        'href': url,
        'download': filename,
      });
      a.innerHTML = '[bytes]';
      body.appendChild(a);
    }

    container.appendChild(rsp_container);
  }

  function _add_symbol(target, symbol) {
    var ok = document.createElement('span');
    ok.innerHTML = symbol;
    target.appendChild(ok);

    setTimeout(function() {
      target.removeChild(ok);
    }, 3000);
  }

  function add_ok(target) {
    return _add_symbol(target, '&#x2713;');
  }

  function add_sandclock(target) {
    return _add_symbol(target, '&#x231b;');
  }

  function add_cross(target) {
    return _add_symbol(target, '&#x2717;');
  }

  function _progressUpdater(container, ev) {
    if (ev.lengthComputable) {
      var progress = Math.round(ev.loaded/ev.total * 100);

      container.innerHTML = progress + '%';
    }
  }

  function performRequest(url, method, data, expectedResponse, onSuccess, onFailure) {
    jso.getToken(function gotToken(token) {
      var xhr = new XMLHttpRequest();
      var auth = [token.token_type, token.access_token].join(' ');
      var player_uid = playerUIDGetter();
      var log_container = logRequestAsCurl(url, method, data, auth);

      var progress_container = log_container.querySelector('.progress');
      progress_container.innerHTML = '0%';

      xhr.addEventListener('load', function(ev){
        logResponseAsCurl(log_container, ev);

        var status = ev.target.status;

        if (status >= 200 && status < 300) {
          if (!!onSuccess) {
            onSuccess(ev.target.response, ev);
          }
        } else {
          if (!!onFailure) {
            onFailure(ev.target.response, ev);
          }
        }
      });

      xhr.addEventListener('progress', _progressUpdater.bind(null, progress_container));
      xhr.upload.addEventListener('progress', _progressUpdater.bind(null, progress_container));

      xhr.open(method, url);
      xhr.responseType = expectedResponse;
      xhr.setRequestHeader('Authorization', auth);

      if (!!player_uid) {
        xhr.setRequestHeader('X-PlayerUID', player_uid);
      }

      xhr.send(data);
    }, {});
  }
  exports.performRequest = performRequest;

  function formSubmitHandler(onSuccess, onFailure, ev) {
    ev.preventDefault();

    var form = ev.target;

    add_sandclock(form);

    var formData = new FormData(form);
    formData._src = form;

    var result_fn = function(symbol_fn, callback, data, xhrev) {
      symbol_fn(form);

      if (!!callback) {
        callback(data, xhrev);
      }
    }

    performRequest(
      form.getAttribute('action'),
      form.getAttribute('method'),
      formData,
      'json',
      result_fn.bind(null, add_ok, onSuccess),
      result_fn.bind(null, add_cross, onFailure)
    );

    return false;
  }

  function fetchSelfieStatus(url, container, intervalGetter) {
    performRequest(url, 'GET', null, 'json', function onSuccess(data, ev) {
      updateSelfieStatus(container, data);

      var status_done = ['Completed', 'Failed', 'Timed Out'].some(function (s) {
        return s == data['status'];
      });
      if (status_done && !!intervalGetter && !!intervalGetter()) {
        clearInterval(intervalGetter());
      }
    }, function onFailure(data, ev) {
      if (!!intervalGetter && !!intervalGetter()) {
        clearInterval(intervalGetter());
      }
    });
  }
  exports.fetchSelfieStatus = fetchSelfieStatus;

  function onSelfieUploadSuccess(data, ev) {
    var container = document.querySelector('#avatars');
    var avatar = document.querySelector('#templates .avatar').cloneNode(true);

    var form = avatar.querySelector('form');
    form.setAttribute('action', data['url']);
    form.addEventListener('submit', formSubmitHandler.bind(
      null,
      function(updated_data, xhrev) {
        updateSelfieStatus(avatar, updated_data);
      },
      null
    ));

    updateSelfieStatus(avatar, data);
    var interval = null;
    interval = window.setInterval(
      fetchSelfieStatus,
      5000,
      data['url'], avatar, function(){ return interval; }
    );

    container.insertBefore(avatar, container.firstChild);
  }
  exports.onSelfieUploadSuccess = onSelfieUploadSuccess

  function onNewPlayerRegistered(data, ev) {
    var player_uid = data['code'];

    localStorage.setItem('player_uid', player_uid);
    document.querySelector('#player_uid').value = player_uid;
  }
  exports.onNewPlayerRegistered = onNewPlayerRegistered

  function _clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function _applyNodeProps(node, props) {
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      node.setAttribute(k, v);
    });
    return node;
  }

  function _discardFormSubmit(ev) {
    ev.preventDefault();

    console.error('implement form.submit');

    return false;
  }

  function downloadFile(ev) {
    ev.preventDefault();

    add_sandclock(ev.target.parentNode);

    performRequest(
      ev.target.getAttribute('href'), 'GET', null, 'arraybuffer',
      function onSuccess(data, xhrev) {
        add_ok(ev.target.parentNode);
      },
      null
    );

    return false;
  }

  function updateSelfieStatus(container, data) {
    ['code', 'created_on', 'ctime', 'status'].forEach(function(fldname) {
      var target = container.querySelector('.' + fldname + ' span');
      var value = data[fldname];

      if (fldname == 'status') {
        value += (', ' + data['progress'] + '%');
      }

      if (target.innerHTML != value) {
        target.innerHTML = value;
      }
    });

    ['mesh', 'texture'].forEach(function(fldname) {
      var target = container.querySelector('.' + fldname + ' a');
      var value = data[fldname];

      if (target.getAttribute('href') != value) {
        target.setAttribute('href', value);
        target.removeEventListener('click', downloadFile);
        target.addEventListener('click', downloadFile);
      }
    });

    var fld_selector = {
      'name': '.name input',
      'description': '.description textarea',
    }

    Object.keys(fld_selector).forEach(function(fldname) {
      var selector = fld_selector[fldname];

      var target = container.querySelector(selector);
      var value = data[fldname];

      if (target.value != value) {
        target.value = value;
      }
    });
  }

  // ===========================================================================

  var jso = null;
  var stored_client_id = localStorage.getItem('client_id');
  var stored_player_uid = localStorage.getItem('player_uid');
  var auth_url = document.querySelector('#auth_form').getAttribute('action');
  var redirect_url = window.location.protocol + '//'
    + window.location.host + window.location.pathname;

  if (!!stored_client_id) {
    document.querySelector('#client_id').value = stored_client_id;

    jso = buildJSO(stored_client_id, auth_url, redirect_url);
    jso.callback();
  }

  if (!!stored_player_uid) {
    document.querySelector('#player_uid').value = stored_player_uid;
  }

  document.querySelector('#auth_form').addEventListener('submit', function onAuthorize(ev) {
    ev.preventDefault()

    var client_id = ev.target.querySelector('#client_id').value;
    if (!client_id) {
      alert('empty client_id');
      return false;
    }

    localStorage.setItem('client_id', client_id);
    jso = buildJSO(client_id, auth_url, redirect_url);

    jso.getToken(function gotToken(token) {
      var token_str = [token.token_type, token.access_token].join(' ');

      document.querySelector('#token_str').innerHTML = token_str;

      document.querySelector('#new_avatar_block').classList.remove('disabled');
      document.querySelector('#player_form').classList.remove('disabled');
      add_ok(ev.target);
    }, {});
  });

  document.querySelector('#unauthorize').addEventListener('click', function onUnAuthorizeClick(ev) {
    localStorage.removeItem('client_id');
    if (!!jso) {
      jso.wipeTokens();
    }

    location.reload();
  });

  document.querySelector('#player_form').addEventListener(
    'submit',
    formSubmitHandler.bind(null, onNewPlayerRegistered, null)
  );

  document.querySelector('#reset_player').addEventListener('click', function onResetPlayerClick(ev) {
    localStorage.removeItem('player_uid');
    document.querySelector('#player_uid').value = '';
  });

  document.querySelector('#selfie_upload_form').addEventListener(
    'submit',
    formSubmitHandler.bind(null, onSelfieUploadSuccess, null)
  );

  window.sample_web = exports;
});
