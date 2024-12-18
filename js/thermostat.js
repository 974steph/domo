  var myDomoData= null;

  var updateRoom =
    function(room) {
      console.log(room);
      console.log(myDomoData[room]);
      $('#date_stat').text(myDomoData.date +" " + myDomoData.heure);
      

      var text = String(myDomoData[room].temp);
      var parts = text.split('.');
      $('#temp_digit').text(parts[0]);
      $('#temp_decimal').text(parts[1]);
      $('#consigne').text(myDomoData[room].consigne);

      //halo
        el = document.querySelector(".t");
        el?.style.setProperty("--temp-hue", 100);
        if (myDomoData[room].temp < myDomoData[room].consigne)
        {
          el?.style.setProperty("--temp-hue", 200);
        }
        if (myDomoData[room].temp >myDomoData.temp_max)
        {
          el?.style.setProperty("--temp-hue", 1);
        }
        



      // tempo

         $('#tempo_state').removeClass();
         $('#tempo_state').addClass("t__circle_icon");
         if (myDomoData.tempo=="blanc")
            $('#tempo_state').addClass("t__circle_icon_white");
         if (myDomoData.tempo=="rouge")
            $('#tempo_state').addClass("t__circle_icon_red");
         if (myDomoData.tempo=="bleu")
            $('#tempo_state').addClass("t__circle_icon_blue");

      //clim
          $('#clim_state').removeClass();
          $('#clim_state').addClass("t__fire_icon");
          if (myDomoData[room].etat==1)
            $('#clim_state').addClass("t__fire_icon--enabled");
          else
            $('#clim_state').addClass("t__fire_icon--disabled");

    };
        
  var loadData = 
      function () {
          var fichier="data/data_temp.json"
          $.ajax({
              'async': true,
              'global': false,
              'url': fichier,
              'dataType': "json",
              'success': function (data) {
                  console.log(data);
                  myDomoData=data;
                   createCustomDropdown("select-room",data.listOfDevices);
                  
              }
          });
      }; 


  var  createCustomDropdown = 
    function(containerId, optionsArray){
      
      // Ensure the target container exists
      const $targetContainer = $('#' + containerId);
      if ($targetContainer.length === 0) {
        console.error(`Container with id "${containerId}" not found.`);
        return;
      };

      // Check if the target container already has children
      if ($targetContainer.children().length > 0) {
        console.warn(`Container with id "${containerId}" already has child elements. Operation aborted.`);
        return;
      };


  
      const $container = $('<div>', { class: '' });
  
      // Create the placeholder from the first option in the array
      const placeholder = optionsArray[0]; // Assuming the first option is a placeholder
      $container.append($('<span>', {
        class: 'sel__placeholder',
        id: "selected_room",
        text: placeholder,
        
        'data-room' :placeholder
        
      }));
    
      // Create the dropdown box container
      const $box = $('<div>', { class: 'sel__box' });
      $container.append($box);
      
      // Add the options to the dropdown box
      optionsArray.forEach((option, i) => {
        if (i === 0){
            $box.append($('<span>', {
            class: 'sel__box__options selected',
            text: option,
            id: option
          }));
          updateRoom(option);
        } 
        else
        {  
          $box.append($('<span>', {
            class: 'sel__box__options',
            text: option,
            id: option
          }));
        }
      });
      
      // Append the created dropdown to the specified container
      $targetContainer.append($container);
    };
  







$( document ).ready(function() {


   
    
    loadData()


    var remainTime = 120 - parseInt((new Date().getTime() / 1000) % 60);
    setTimeout(function()
    {
        loadData();

        setInterval(loadData, 60000);
    }, remainTime*1000);



});







$('.sel').click(function() {
  $(this).toggleClass('active');
});


$('#select-room').on('click', '.sel__box__options', function() {
  var txt = $(this).text();
  
  $(this).siblings('.sel__box__options').removeClass('selected');
  $(this).addClass('selected');
  $('#selected_room').text(txt);
  $('#selected_room').attr('data-room', txt);
  updateRoom(txt);
  
});







