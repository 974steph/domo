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
                      max: 100,
                      min: 0,
                      grid: {
                            display: true,
                            color: function(context) {
                                if (context.tick.value == 50  || context.tick.value == 60) {
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
      
      

     


    
      function getHumidity(data)
      {  
           return {
          yAxisID: 'A',
          label: 'Humidity',
          data: data,
          type: 'line',
          lineTension: 0.1,
          borderColor: "#0000FF",
          backgroundColor: "#0000FF"
          
        };


      }

    
    
    
    

    function update(room,libelle)
    {  $('#piece').html(libelle);
       
       
       dataHumidity=dataDomo[room]["humidity_hist"];
       dates=dataDomo[room]["date_hist"]
       
       var newDataObject =  {
                  datasets: [getHumidity(dataHumidity)],
                  labels: dates
                }
       
       graphique.data=newDataObject
       graphique.update()

    }


    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null) {
           return null;
        }
        return decodeURI(results[1]) || 0;
    }

    $( document ).ready(function() {
        

      

      var dates=['08:00', '08:10','08:15', '08:20','08:25','08:30']
            
      var mychart = document.getElementById("graph_ID").getContext("2d");
      graphique= new Chart(mychart, {
        type: 'line',     
        data: {
          datasets: [getHumidity([])],
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
          
          var p_date=$.urlParam('date')
          if( p_date != null)
          {
            
            if(p_date.length==8)
            { fichier="data/data_" +p_date+".json"
            }
          }
          


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
    

      
