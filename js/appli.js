var graphique;
    var dataDomo;
    


    $('#room').on('change', function()
    {
        var titre = $(this).children("option:selected").text();
        console.log(titre)
        update(this.value,titre); 
    });
    

    var plugins= {
          legend: {
            display: false
          },
          tooltip: {
            usePointStyle: true,
          },
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
             
              mode: 'x',
            },
            pan: {
              enabled: true,
              mode: 'x',
            },
            limits: {
              x: {
                minRange: 3
              },
            },
          }
        }

    var options={
              responsive: true,
              scales: {
                    A: {
                      type: 'linear',
                      position: 'left',
                      ticks: { beginAtZero: false },
                      // Hide grid lines, otherwise you have separate grid lines for the 2 y axes
                      grid: { display: false },
                      max: 35,
                      min: 0,
                      grid: {
                            display: true,
                            color: function(context) {
                                if (context.tick.value == 15) {
                                  return "#ff0000";
                                } else  {
                                 return false;
                                }

                               
                              },
                          },
                     
                  },
                  B: {
                      display: false,
                      position: 'right',
                      max: 30,
                      min: 0,
                  },
                  x: { ticks: { beginAtZero: false } ,
                    },

                 
                
              },
              plugins: plugins







            }
      function getOnOFF(data)
      {  
           return {
        yAxisID: 'B',
        label: 'on/Off',
        data: data,
        pointRadius: 0,
        stepped: true,
        type: 'line',
        fill: true,
        borderColor: "#FF0000",
        backgroundColor: "#FF0000"
       };


      }


    
      function getTemp(data)
      {  
           return {
          yAxisID: 'A',
          label: 'temp',
          data: data,
          type: 'line',
          lineTension: 0.1,
          borderColor: "#0000FF",
          backgroundColor: "#0000FF"
          
        };


      }

    
    
    
    

    function update(room,libelle)
    {  $('#piece').html(libelle);
       
       dataTemp=dataDomo[room]["temp"];
       dataOnOff=dataDomo[room]["state"]
       dates=dataDomo[room]["date"]
       var newDataObject =  {
                  datasets: [getOnOFF(dataOnOff), getTemp(dataTemp)],
                  labels: dates
                }
       
       graphique.data=newDataObject
       graphique.update()

    }




    $( document ).ready(function() {
        



      var dates=['08:00', '08:10','08:15', '08:20','08:25','08:30']
            
      var mychart = document.getElementById("graph_ID").getContext("2d");
      graphique= new Chart(mychart, {
        type: 'line',     
        data: {
          datasets: [getOnOFF([]), getTemp([])],
          labels: dates
        },
        options: options
        //end data      
      });



      dataDomo = (function () {
          var json = null;
          var formattedDate = new Date();
          //var d = formattedDate.getDate();
          var d =("0" + formattedDate.getDate()).slice(-2);
          //var m =  formattedDate.getMonth();
          var m = ("0" + (formattedDate.getMonth() + 1)).slice(-2)
          var y = formattedDate.getFullYear();      
          var fichier="data/data_" + y + m + d +".json"
          console.log(fichier)
          $.ajax({
              'async': true,
              'global': false,
              'url': fichier,
              'dataType': "json",
              'success': function (data) {
                  json = data;
                  dataDomo=data;
                  
                
                  $("#date_stat").text(dataDomo.date + " "+dataDomo.heure)
                  $("#room").val("salon").change();
              }
          });
          return json;
      })(); 

        
    });
    

      
