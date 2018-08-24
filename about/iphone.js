function responsiveChat(element) {
    $(element).html('<form class="chat"><span></span><div class="messages"></div><input type="text" placeholder="Your message"><input type="submit" value="Send"></form>');

    function showLatestMessage() {
        $(element).find('.messages').scrollTop($(element).find('.messages').height());
    }
    showLatestMessage();


    $(element + ' input[type="text"]').keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $(element + ' input[type="submit"]').click();
        }
    });
    $(element + ' input[type="submit"]').click(function (event) {
        event.preventDefault();
        var message = $(element + ' input[type="text"]').val();
        if ($(element + ' input[type="text"]').val()) {
            var d = new Date();
            var clock = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
            var month = d.getMonth() + 1;
            var day = d.getDate();
            var currentDate =
                (("" + day).length < 2 ? "0" : "") +
                day +
                "." +
                (("" + month).length < 2 ? "0" : "") +
                month +
                "." +
                d.getFullYear() +
                "&nbsp;&nbsp;" +
                clock;
            $(element + ' div.messages').append(
                '<div class="message"><div class="myMessage"><p>' +
                message +
                "</p><date>" +
                currentDate +
                "</date></div></div>"
            );
            setTimeout(function () {
                $(element + ' > span').addClass("spinner");
            }, 100);
            setTimeout(function () {
                $(element + ' > span').removeClass("spinner");
            }, 2000);
        }
        $(element + ' input[type="text"]').val("");
        showLatestMessage();
    });
}

function responsiveChatPush(element, sender, origin, date, message) {
    var originClass;
    if (origin == 'me') {
        originClass = 'myMessage';
    } else {
        originClass = 'fromThem';
    }
    $(element + ' .messages').append('<div class="message"><div class="' + originClass + '"><p>' + message + '</p><date><b>' + sender + '</b> ' + date + '</date></div></div>');
}

/* Activating chatbox on element */
responsiveChat('.responsive-html5-chat');

/* Let's push some dummy data */
responsiveChatPush('.chat', 'Brendan O&apos;Hare', 'you', '08.03.2017 14:30:7', 'You can tell a lot about a person from which emojis they use the <a href="https://www.youtube.com/watch?v=YjHbCB-zicQ">most</a>. ');
responsiveChatPush('.chat', 'Ryan', 'me', '07.25.1998', 'These are Ryan&apos;s top three (3) at the moment:');
responsiveChatPush('.chat', 'Sonia Sotomayer', 'me', '08.03.2016 14:31:22', '🤔🤗😤');


responsiveChatPush('.chat', 'Amir Blumenfeld', 'you', '08.03.2017 14:30:7', 'Some facts about Ryan:');
responsiveChatPush('.chat', 'Adam Real-Last-Name-Unknown', 'me', '08.03.2016 14:31:22', 'Ryan&apos;s favorite part of the flag is the bars');
responsiveChatPush('.chat', 'Paul Proteus', 'me', '08.03.2016 14:31:22', 'One time Ryan got four (4) detentions because the IT guy at his middle school caught him typing curse words into Google translate. Ryan is still harboring resentment about it to this day and its effects can probably be traced to how he became the person he is today');
responsiveChatPush('.chat', 'Xavier Timecube', 'me', '08.03.2096 25:11:11', 'Ryan doesn&apos;t believe in Astrology because Ryan is a Leo and Leo&apos;s never believe in Astrology');
responsiveChatPush('.chat', 'Ignatius J. Reilly', 'me', '08.03.2016 14:31:22', 'Ryan was not a 2008 junior Olympic champion in fencing');

responsiveChatPush('.chat', 'Gino', 'you', '08.03.2017 14:30:7', 'Services Ryan offers:');
responsiveChatPush('.chat', 'Judy Blotnick', 'me', '04.14.2018 9:30', 'For $3, Ryan will text your ex something really mean');
responsiveChatPush('.chat', 'Ray Dalio', 'me', '08.03.2016 14:31:22', 'Ryan is willing to throw goldfish/cheese balls/other various foodstuffs at your mouth until at least one goes in');
responsiveChatPush('.chat', 'Andy Serkis', 'me', '08.03.2016 14:31:22', 'Not really a service, but if you know of any place that rents out those really big Chinese dragon costumes that can fit like six (6) people, Ryan has been in the market for one for quite some time and would appreciate some tips');



responsiveChatPush('.chat', 'Thich Naht Hanh', 'you', '14:30:7', 'Contacting Ryan:');
responsiveChatPush('.chat', 'Rei Kawakubo', 'me', '08.03.2016 14:31:22', 'You can reach Ryan outside and sometimes inside. If you plan on reaching out, you can usually expect to hear back within 3-40 business days via smoke signals from the top of Wren. Ryan is also on Facebook.');
responsiveChatPush('.chat', 'John Lautner', 'me', '08.03.2016 14:31:22', 'Also, any messages you send from here will go right to his email so that is a good way, too');



/* DEMO */
if (parent == top) {
  $("a.article").show();
}
