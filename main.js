
$(document).ready(function(){
    $("#addition").click(function(){
      $("ol").prepend("<input>");
    });
    $("#password").click(function(){
      $("ol").prepend("<input>");
    });
    $("#file").click(function(){
      $("ol").prepend("<input>");
    });

    $("#delete").click(function(){
      $("ol").empty();
    });

  $("#warning").click(function(){
      alert("Mistake");
    });
$('body').on('click', '.passwordview', function(){
if ($('#password-input').attr('type') == 'password'){
  $(this).addClass('view');
  $('#password-input').attr('type', 'text');
} else {
  $(this).removeClass('view');
  $('#password-input').attr('type', 'password');
}
return false;
});
  });