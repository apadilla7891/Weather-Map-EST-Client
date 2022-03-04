$(document).ready(function () {
    //ensures that only the search bar is visible on launch
	$('#currentDiv').hide();
	$('#forecastDiv').hide();
	
	//search button click response
	$('#searchButton').on("click",function(){
		// since the unit will always be valid runs a validation test to make sure that the zipcode is valid otherwise the click fails and an error is printed
		var haveValidationErrors = checkAndDisplayValidationErrors($('#searchForm').find('input'));
		if(haveValidationErrors) {
            return false;
        }
		
		//clears anything that might have already been shown and call functions to repopulate each section
		clearResults();
		conditionResults();
		clearFiveDayForecast();
		forecastResults();
	});
});

//function to populate the first major section: current conditions
function conditionResults(){
	//emptys out any existing errors
	$('#errorMessages').empty();
	//grabs zipcode and unit from user inputs and sets vars equal to divs that will be edited for easy access
	var zipcode = $('#addZipcode').val();
	var unit = $('#addUnit').val();
	var cityDiv = $('#cityDiv');
	var currentTemp = $('#currentTemp');
	var conditionPic = $('#conditionPic');
	//ajax call to api to get the current weather 
	$.ajax({
		type:'GET',
		url:'https://api.openweathermap.org/data/2.5/weather?zip=' + zipcode + '&units=' + unit + '&appid=xxx', 
		success: function(data){
			//gets the city name and sets it into the header for teh section
			var city = data.name;
			var condition = '<h3>Current Conditions in ' + city + '</h3>';
			cityDiv.append(condition);
			
			//uses unit value to deteremine the symbols to be used for temperature and wind speed
			if(unit == 'imperial'){
				var tempSymbol = "F";
				var speedSymbol = "mph";
			}else{
				var tempSymbol = "C";
				var speedSymbol = "km/h";
			}
			
			//gets the temperature, humidity, wind speed and adds the corresponding symbols before adding it to the right side of section
			var temp = data.main.temp;
			var humidity = data.main.humidity;
			var wind = data.wind.speed;
			condition = '<p>Temperature: ' + temp + tempSymbol + '</p>'; 
			currentTemp.append(condition);
			condition = '<p>Humidity: ' + humidity + '%</p>'; 
			currentTemp.append(condition);
			condition = '<p>Wind: ' + wind + speedSymbol + '</p>'; 
			currentTemp.append(condition);
			
			//gets the corresponding icon for the current conditions and a description before placing it into the left side
			var weatherImg = 'http://openweathermap.org/img/w/' + data.weather[0].icon + '.png';
			var description = data.weather[0].description;
			condition = '<img src=' + weatherImg + ' alt= "icon">';
			conditionPic.append(condition);
			condition = '<p>' + description + '</p>';
			conditionPic.append(condition);
			
			//displays the current conditions to user
			resultDisplay();
		},
		error: function() {
			//error message if api cannot be reached
            $('#errorMessages')
                .append($('<li>')
                .attr({class: 'list-group-item list-group-item-danger'})
                .text('Zip code: please enter a 5-digit zip code'));
        }
	});
}

//function to populate the forecast
function forecastResults(){
	//emptys out any existing errors
	$('#errorMessages').empty();
	
	//grabs zipcode and unit from user inputs
	var zipcode = $('#addZipcode').val();
	var unit = $('#addUnit').val();
	//since temperature symbol is a constant it is dtermined now to save it from being done repeatedly later
	var tempSymbol;
    if (unit=='metric'){
        tempSymbol = ' C';
    }
    else{
        tempSymbol = ' F';
    }
	//ajax call to api to get 5day/3hour forecast
	$.ajax({
		type: 'GET',
		url: 'https://api.openweathermap.org/data/2.5/forecast?zip=' + zipcode + '&units=' + unit + '&appid=xxx', 
		success: function(data){
			//list to contain all data obtained
			var list = data.list;
			//array to hold all minimum temperatures
            var minTemps = [];
			//array to hold all max temps
            var maxTemps = [];
			//array to hold all weather icons
            var icons = [];
			//array to hold all daily weather
            var weathers = [];
			//gets date for next day
            var date = list[0].dt_txt.split(" ")[0];
			//makes a new array already filled with the first day we need
            var days = [displayDate(date)];
			//arbitrary numbers that will ensure max and min are always taken when compared regardless of unit
            var minDayTemp = 1000;
			var maxDayTemp = -1000;
            
			// loop going through the list we extracted from data
            $.each(list, function(index, forecast){
				//since our data is in intervals of 3 hours we want to make sure that we only get an icon once per day
				//we check to see if its perfectly dividable by 8 ensure 24 hours have passed and its a new day before adding the icon to the list
                if (index%8===0){
                    icons.push("http://openweathermap.org/img/w/"+forecast.weather[0].icon+".png");
                    weathers.push(forecast.weather[0].main);
                }
				//gets the min temp regardless of date
                if (forecast.main.temp_min<minDayTemp){
                    minDayTemp = forecast.main.temp_min;
                }
				//gets the max temp regardless of date
                if (forecast.main.temp_max>maxDayTemp){
                    maxDayTemp = forecast.main.temp_max;
                }
				//checks to see if the date is different from the current date held (intial date is the first day: tomorrow)
				//if the day is different then we push the day and the min/max temp to respective arrays
				// because we already start at first day our temps are a day early. we dont reset the temp dummy values until a new day is reached
                if (forecast.dt_txt.split(" ")[0] !== date){
                    date = forecast.dt_txt.split(" ")[0];
                    days.push(displayDate(date));
                    minTemps.push(minDayTemp);
                    maxTemps.push(maxDayTemp);
                    minDayTemp = 1000;
                    maxDayTemp = -1000;                    
                }
            });
			
			//we push the temps and extra time out of the loop since they wont reset on a last day and its still missing due to the day we start our loop
            minTemps.push(minDayTemp);
            maxTemps.push(maxDayTemp);
            
			//we loop through putting all the data into its divs of the the forecast section
            var i;
            for (i = 0; i < 5; i++){                
				//we make a new image object and insert its source as the icon link from our array
                var img = document.createElement("img");
                img.src = icons[i];
				//using our various array insert the data into the forecast section
                $('#day'+ i + 'Div').append('<text>'+days[i]+'<br></text>');
                $('#day'+ i + 'Div').append(img);
                $('#day'+ i + 'Div').append('<text>' +weathers[i] + '<br></text>');
                $('#day'+ i + 'Div').append('<text>H ' + maxTemps[i] + tempSymbol + ' L ' + minTemps[i] + tempSymbol + '</text>');
                
				// make the forecast section visible to users
                $('#forecastTitleDiv').show();
                $('#weekforecastDiv').show();
			}
		},
		error: function() {
			//error message if api cannot be reached
            $('#errorMessages')
                .append($('<li>')
                .attr({class: 'list-group-item list-group-item-danger'})
                .text('Zip code: please enter a 5-digit zip code'));
        }
	});
}

//passes the date gotten from the api and prepares it to be presented to user
function displayDate(date){
	//splits the date object ex(2022-2-22) at the - and puts the month and day into objects
    var month = parseInt(date.split("-")[1]);
    var day = parseInt(date.split("-")[2]);
    //var to be used to deliver formatted date, loads with day initially
	var result = "";
    result += day;
	
	//using the month number it gets the coresponding word name for the month
    switch(month){
        case 1:
            result += " January";
            break;
        case 2:
            result += " February";
            break;
        case 3:
            result += " March";
            break;
        case 4:
            result += "April";
            break;
        case 5:
            result += " May";
            break;
        case 6:
            result += " June";
            break;
        case 7:
            result += " July";
            break;
        case 8: 
            result += " August";
            break;
        case 9:
            result += " September";
            break;
        case 10:
            result += " October";
            break;
        case 11:
            result += " November";
            break;
        case 12: 
            result += " December";
            break;
        default:
            result += " January";
            return result;
    }
    return result;
}

//clears the current conditions section of any data
function clearResults(){
	$('#cityDiv').empty();
	$('#currentTemp').empty();
	$('#conditionPic').empty();
}
//clears any data in the 5 day forecast
function clearFiveDayForecast(){
    var i;
    for (i = 0; i < 5; i++){                
    $('#day'+ i + 'Div').empty();
    }
}

//displays the current conditions and forecast
function resultDisplay(){
	$('#currentDiv').show();
	$('#forecastDiv').show();
}

// checks the passed input for errors
function checkAndDisplayValidationErrors(input) {
    //emptys potential errors already loaded
    $('#errorMessages').empty();
    
	//array to hold error the input might potentially have
    var errorMessages = [];

    // go through the input and check for validation errors
    input.each(function() {
        // Uses the HTML5 validation API to find the validation errors
        if(!this.validity.valid)
        {
            var errorField = $('label[for='+this.id+']').text();
            errorMessages.push(errorField + 'Zip code: please enter a 5-digit zip code');
        }
    });

    // prints any validation errors found out to user
    if (errorMessages.length > 0){
        $.each(errorMessages,function(index,message){
            $('#errorMessages').append($('<li>').attr({class: 'list-group-item list-group-item-danger'}).text(message));
        });
        // return true if there were errors
        return true;
    } else {
        // return false if there weren't errors
        return false;
    }
}