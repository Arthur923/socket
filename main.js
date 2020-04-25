$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var FADE_TIME = 150; 
  var TYPING_TIMER_LENGTH = 400; 
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#e22400', '#91590f', '#f8a700', '#f78b00',
    '#58dc00', '#289b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // инициализируем переменные
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var socket = io();
  const addParticipantsMessage = (data) => {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }
  // установление имени пользователя
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());
    // или подходит имя пользователя
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      // передача имени . никнейма серверу
      socket.emit('add user', username);
    }
  }
  // отправляет чат сообщение
  const sendMessage = () => {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }
  // регестрируем это сообщение
    const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }
  // Добавляет визуальное сообщение чата в список сообщений
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);
    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);
    addMessageElement($messageDiv, options);
  }
  // Добавляет визуальное сообщение о наборе чата
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }
  // Удаляет визуальное сообщение о наборе чата
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }
// Добавляем элемент сообщения к сообщениям и прокручиваем вниз
   // el - элемент, который нужно добавить как сообщение
   // options.fade - если элемент должен появиться (default = true)
   // options.prepend - если элемент должен предшествовать
   // все остальные сообщения (по умолчанию = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);
    // по умолчаниб настройки
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }
// Применить параметры
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }
// предотвращает ввод 
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }
  // обновляет процесс введения
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();
      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }
// Получает сообщения «юзер печатает» пользователя
  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }
// События клавиатуры
  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });
  $inputMessage.on('input', () => {
    updateTyping();
  });
  // События нажатия на мышку
// Фокус ввода при нажатии в любом месте на странице входа
  $loginPage.click(() => {
    $currentInput.focus();
  });
// Фокус ввода при нажатии на границу ввода сообщения
  $inputMessage.click(() => {
    $inputMessage.focus();
  });
  // Socket 
// Всякий раз, когда сервер выдает 'login', регистрирует сообщение для входа
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });
// Каждый раз, когда сервер отправляет «новое сообщение», обновляем тело чата
  socket.on('new message', (data) => {
    addChatMessage(data);
  });
// Всякий раз, когда сервер отправляет сообщение «пользователь присоединился», регистрируйте его в теле чата
  socket.on('user joined', (data) => {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });
// Всякий раз, когда сервер отправляет «печатает», показать сообщение о наборе
  socket.on('печатает', (data) => {
    addChatTyping(data);
  });
  // убирает сообщение выше 
  socket.on('stopped', (data) => {
    removeChatTyping(data);
  });
  socket.on('disconnect', () => {
    log('you have been disconnected');
  });
  socket.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });
  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });
});
