       
(function ($) {
  "use strict";
  $(function () {
 
      Proj4js.defs["EPSG:3003"] = "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs";
      var projSource = new Proj4js.Proj("EPSG:4326"); 
      var projDest = new Proj4js.Proj("EPSG:3003"); 
      var mapMarker;
      var mapMarkerOptions = {
        icon: 'images/marker32.png',
        draggable: true
      }


      //CALCOLA LA URL PER I TILE A SECONDA DEL TIPO DI LIVELLO WMS O WMTS (TILES IN CACHE)
      function getTileUrl (map, baseUrl,layerName,layerType){
        var fn;
        if(layerType == "WMS"){

            fn = function(tile, zoom) {
                var projection = map.getProjection();
                var zpow = Math.pow(2, zoom);
                var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
                var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
                var ulw = projection.fromPointToLatLng(ul);
                var lrw = projection.fromPointToLatLng(lr);
                var bbox = ulw.lng() + "," + ulw.lat() + "," + lrw.lng() + "," + lrw.lat();
                console.log(baseUrl +  "&LAYERS=" + layerName  + "&SERVICE=WMS&TRANSPARENT=true&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:4326&BBOX=" + bbox + "&width=256&height=256");

                return baseUrl +  "&LAYERS=" + layerName  + "&SERVICE=WMS&TRANSPARENT=true&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:4326&BBOX=" + bbox + "&width=256&height=256";
            }
        }
        else if(layerType == "WMTS"){
            fn = function (coord, zoom) {
                return owsBaseURL + "/wmts/" + layerName + "/" + tileGridName + "/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
            };
        }
        return fn
      }

      //MOSTRA LE COORDINATE RELATIVE ALLA POSIZIONE DEL MOUSE
      function onMouseMove(e){
        var position = 'Coordinate' + ': Lng: ' + e.latLng.lng().toFixed(6) + ' Lat: ' + e.latLng.lat().toFixed(6);
        var p = new Proj4js.Point(e.latLng.lng(),e.latLng.lat());  
        Proj4js.transform(projSource, projDest, p);
        position = position + ' - X: ' + p.x.toFixed(2) + ' Y: ' + p.y.toFixed(2);
        if($("#coords").length){
          $("#coords").text(position);
        }$("#coords").text(position);
      };

      function writePosition(marker){
        var position = marker.getPosition();
        var lat = position.lat();
        var lng = position.lng();
        var p = new Proj4js.Point(lng,lat);  
        Proj4js.transform(projSource, projDest, p);
        var x = p.x.toFixed(2);
        var y = p.y.toFixed(2)
        $("#coordx").val(x);
        $("#coordy").val(y);
        $("#geometry").val(lng.toFixed(6) + ' ' + lat.toFixed(6));

      }

      function initMap() {
        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 44.35, lng: 9.18},
          zoom: 12,
          minZomm: 8
        });
        google.maps.event.addListener(map, 'mousemove', onMouseMove);

        var drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: ['marker']
          },
          markerOptions: mapMarkerOptions
        });
        drawingManager.setMap(map);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
          drawingManager.setDrawingMode(null);
          if (mapMarker){
            e.overlay.setMap(null);
            mapMarker.setPosition(e.overlay.getPosition());
          }
          else{
            mapMarker = e.overlay;
            writePosition(mapMarker);
            google.maps.event.addListener(mapMarker, 'dragend', function() {
              writePosition(mapMarker);
            })
          }
        });

        //Aggiungo il marker salvato
        if($("#geometry").val()){
          mapMarker = new google.maps.Marker(mapMarkerOptions);
          var p = $("#geometry").val().split(' ');
          if (p.length==2){
            var position = {lat: parseFloat(p[1]), lng: parseFloat(p[0])}
            mapMarker = new google.maps.Marker(mapMarkerOptions);
            mapMarker.setPosition(position);
            mapMarker.setMap(map);
          }
          google.maps.event.addListener(mapMarker, 'dragend', function() {
            writePosition(mapMarker);
          });
        }

        //LAYER DI SFONDO OSM
        var layerOptions = {
          tileSize: new google.maps.Size(256, 256),
          isPng: true,
          name: "OSM",
          maxZoom: 19,
          minZoom: 0,
          getTileUrl: function(coord, zoom) {
              return "http://tile.openstreetmap.org/" +
              zoom + "/" + coord.x + "/" + coord.y + ".png";
          }
        }

        var osmMapType = new google.maps.ImageMapType(layerOptions);
        map.mapTypes.set("OSM", osmMapType); //AGGINGO E LO SETTO DI DEFAULT
        var mapTypeIds = ["OSM",google.maps.MapTypeId.ROADMAP,google.maps.MapTypeId.TERRAIN,google.maps.MapTypeId.SATELLITE,google.maps.MapTypeId.HYBRID];
        map.setMapTypeId("OSM");

        map.setOptions({"mapTypeControlOptions": {
          "mapTypeIds": mapTypeIds,
          "style": google.maps.MapTypeControlStyle.DROPDOWN_MENU
        }});

        //OVERLAYS
        var layer,layerOptions;
        for (var i=0; i < mapLayers.length; i++) {
          layer = mapLayers[i];
          console.log(layer)
          layerOptions = {
            tileSize: new google.maps.Size(256, 256),
            isPng: true,
            opacity: layer.opacity || 1,
            name: layer.name,
            getTileUrl: getTileUrl(map,layer.url,layer.name,layer.type)
          }
          layer = new google.maps.ImageMapType(layerOptions);
          map.overlayMapTypes.setAt(map.overlayMapTypes.length, layer);

        }

      }//end initMap

      initMap()

  });

})(jQuery);


