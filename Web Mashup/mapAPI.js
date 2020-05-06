//creates the map
//uses HTML Geolocation and Google Places API
function initMap() {
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11.5,
  });
  //var infoWindow = new.google.maps.InfoWindow;

  //HTML 5 geolocation
  //This gets the user location when they start the code.
  //If geolocation is possible
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        //puts the current position in the pos variable
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        //adds a marker at position pos
        addMarker(pos, map);

        //centers the map at pos
        map.setCenter(pos);

        pagination(map, pos);
      },
      function () {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    //Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  //sends error function
  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
  }

  //handles search queries and autocomplete
  autocompleteSearch(map);
}

// --------------------------------------------------------------------------------------------------------

function pagination(map, pos) {
  // Refresh the list in case of new search
  var ul = document.getElementById("places");
  ul.innerHTML = "";
  //console.log(pos);
  //window.onload = function () {
  // Create the Places Services
  var service = new google.maps.places.PlacesService(map);
  var getNextPage = null;
  var moreButton = document.getElementById("more");
  moreButton.onclick = function () {
    moreButton.disabled = true;
    if (getNextPage) getNextPage();
  };

  // Perform a nearby search
  service.nearbySearch(
    { location: pos, radius: 50000, type: ["tourist_attraction"] },
    function (results, status, pagination) {
      if (status !== "OK") return;

      //console.log(results);
      createMarkers(map, results);
      moreButton.disabled = !pagination.hasNextPage;
      getNextPage =
        pagination.hasNextPage &&
        function () {
          pagination.nextPage();
        };
    }
  );
  //};
}

function createMarkers(map, places) {
  var bounds = new google.maps.LatLngBounds();
  var placesList = document.getElementById("places");

  for (var i = 0, place; (place = places[i]); i++) {
    var image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25),
    };

    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      title: place.name,
      position: place.geometry.location,
    });

    var li = document.createElement("li");
    li.textContent = place.name;
    placesList.appendChild(li);

    //bounds.extend(place.geometry.location);
  }

  //map.fitBounds(bounds);
}

// --------------------------------------------------------------------------------------------------------

//Adds marker to map at position pos in the map passed in
function addMarker(pos, map) {
  var marker = new google.maps.Marker({
    position: pos,
    map: map,
  });
}

// -------------------------------------------------------------------------------------------------------

//handles Search Queries
//PreCondition: Given a map to place queries on
//PostCondition: Moves the map to the search query and places a marker on it.
function autocompleteSearch(map) {
  //Links to div in TraView.html with id=pac-card
  var card = document.getElementById("pac-card");
  //Links to style.css
  var input = document.getElementById("pac-input");
  //Links to style.css
  var types = document.getElementById("type-selector");
  //This links to the TraView.html file
  var strictBounds = document.getElementById("strict-bounds-selector");

  //puts the card in the top right corner of the map
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

  var autocomplete = new google.maps.places.Autocomplete(input);

  //Bind the map's bounds (view) property to the autocomplete object,
  //so that the autocomplete requests use the current map bounds
  //for the bounds option in the request
  autocomplete.bindTo("bounds", map);

  //Set the data fields to return when the user selects a place
  autocomplete.setFields(["address_components", "geometry", "icon", "name"]);

  //will display info about user search location
  var infowindow = new google.maps.InfoWindow();
  //links to style.css
  var infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);

  //This is the marker that shows up on the search
  var marker = new google.maps.Marker({
    map: map,
    anchor: new google.maps.Point(0, -29),
  });

  //Activates when a location is chosen
  autocomplete.addListener("place_changed", function () {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      //User entered the name of a Place that was not suggested and
      //pressed the Enter key, or the Place Details request failed
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    //If the place has a geometry, then present it on the map
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
      map.setZoom(11.5);
      map.setCenter(place.geometry.location);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
    }
    //place the marker on the location
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    //The address returns in various components.
    //Here we are taking the first 3 components and
    //joining them together into a string
    var address = "";
    if (place.address_components) {
      address = [
        (place.address_components[0] &&
          place.address_components[0].short_name) ||
          "",
        (place.address_components[1] &&
          place.address_components[1].short_name) ||
          "",
        (place.address_components[2] &&
          place.address_components[2].short_name) ||
          "",
      ].join(" ");
    }
    weather(place);
    yelp(place);
    var coord = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    pagination(map, coord);

    /*
    //if the place has an icon, use that icon in the infoWindow
    infowindowContent.children["place-icon"].src = place.icon;
    //if the place has a name, use that name in the infoWindow
    infowindowContent.children["place-name"].textContent = place.name;
    //if the place has an address, use it in the infoWindow
    infowindowContent.children["place-address"].textContent = address;
    //display the infoWindow in the new location
    infoWindow.open(map, marker); 
    */
  });

  //Sets a listener on a radio button to change the filter type on Places Autocomplete
  function setupClickListener(id, types) {
    var radioButton = document.getElementById(id);
    radioButton.addEventListener("click", function () {
      autocomplete.setTypes(types);
    });
  }

  setupClickListener("changetype-all", []);
  setupClickListener("changetype-address", ["address"]);
  setupClickListener("changetype-establishment", ["establishment"]);
  setupClickListener("changetype-geocode", ["geocode"]);

  document
    .getElementById("use-strict-bounds")
    .addEventListener("click", function () {
      console.log("Checkbox clicked! New state=" + this.checked);
      autocomplete.setOptions({ strictBounds: this.checked });
    });
}

//----------------------------------------------------------------------------------------------------

//weather api
//gets the weather data from Open Weather Map and can be seen in console (inspect TraView when you run it through LiveServer)
function weather(pos) {
  var key = "";

  fetch(
    "http://api.openweathermap.org/data/2.5/forecast?q=" +
      pos.name +
      "&appid=" +
      key
  )
    .then((response) => {
      return response.json();
      //data = JSON.parse(response);
    })
    .then((data) => {
      //console.log(data);
      // Gets all the Classes from the HTML
      var days = document.querySelectorAll("div.a, div.b, div.c, div.d, div.e");
      var j = 0;
      // Goes through all the classes and puts information in the correct divs
      for (i = 0; i < 5; i++) {
        document.getElementById(days[i].id).innerHTML =
          timeConverter(data.list[j].dt) +
          '<br style="padding-top: 2px;"></br>' +
          "<p>Temp: " +
          tempConverter(data.list[j].main.temp) +
          "&#8457</p>" +
          '<br style="padding - top: 2px;"></br>' +
          "<p>MIN/MAX: <br>" +
          tempConverter(data.list[j].main.temp_min) +
          "&#8457/" +
          tempConverter(data.list[j].main.temp_max) +
          "&#8457</p>" +
          "<br></br>" +
          "<p>" +
          data.list[j].weather[0].description +
          "</p>";

        // console.log(
        //   document.getElementById(days[i].id).getElementsByTagName("img")
        // );
        document.getElementById(days[i].id).innerHTML +=
          '<img src="https://openweathermap.org/img/w/' +
          data.list[j].weather[0].icon +
          '.png" alt="" />';
        j += 8;
      }
    });

  // Converts from UNIX time to standard time IN US TIME CURRENTLY
  // May be able to use .toISOString instead to fix time zones
  function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);

    //returns M/DD/YYYY
    var s = new Date(a).toLocaleDateString("en-US");

    //returns H:MM:SS
    var t = new Date(a).toLocaleTimeString("en-US");

    return "<p>" + s + "</p><p>" + t + "</p>";
  }

  // Converts Kelvins into Farenheit. Can add Celsius easily
  function tempConverter(temp) {
    var farenheit = Math.round((temp - 273.15) * (9 / 5) + 32);

    return farenheit;
  }
}

// -------------------------------------------------------------------------------------------------

//Doesn't work yet
function yelp(pos) {
  var API_key =
    "";

  var url =
    "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=restaurant&location=" +
    pos.name +
    "&limit=30&wheelchair_accessible";

  var req = new Request(url, {
    method: "GET",
    headers: new Headers({
      Authorization: "Bearer " + API_key,
      "Content-Type": "application/json",
    }),
  });

  fetch(req)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error();
      }
    })
    .then((data) => {
      //var obj = JSON.parse(data);
      //console.log(data.businesses[0].name);
      var placesList = document.getElementById("yelp-places");
      placesList.innerHTML = "";
      //console.log(data.businesses);
      //Format data here
      for (i = 0; i < data.businesses.length; i++) {
        //console.log(data.businesses[i].name);
        var li = document.createElement("li");
        li.innerHTML =
          '<img src="' +
          data.businesses[i].image_url +
          '" alt=""/>' +
          "<h3>&emsp;" +
          data.businesses[i].name +
          "</h3>" +
          "<br>" +
          "<p>&emsp;" +
          "Rating: " +
          data.businesses[i].rating +
          "&emsp;Price: " +
          data.businesses[i].price +
          "</p>";
        //console.log(data.businesses[i].image_url);
        placesList.appendChild(li);
      }
    })
    .catch((err) => {
      console.log("ERROR: ", err.description);
    });
}
