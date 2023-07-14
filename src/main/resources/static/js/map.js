/**
 *
 */

window.onload = function () {
	let xyArr = {};
    /*	const secretKey = 'fe95f4d500344dd1a9b5';
        const consumerKey = 'ac56635afecd4d59824a';
        var accessTimeout = undefined;
        var accessToken = undefined;*/
    //내 토큰 추가
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMDE5YTc2Ni1mNmUxLTRjZDYtYTRiMC03YmNlMDE3MzZhODkiLCJpZCI6MTQ0NTM4LCJpYXQiOjE2ODU5NTEyNzN9.4oC0ZuLdH7F45DKUMsJg7xh-nP3lEkiLg5Q3B0s0ER8';
    const viewer = new Cesium.Viewer("cesiumContainer");

    const scene = viewer.scene;
    scene.globe.depthTestAgainstTerrain = true;
    var searchArea = new Cesium.PrimitiveCollection();

    var CameraUtil = function () {
    };
    CameraUtil.flyToNormal = function (xyzArr, callback) {
        var tempArr = new Array(3);

        //인자값이 적합하다면
        if (Cesium.defined(xyzArr) && xyzArr.length === 3) {
            tempArray = xyzArr;
        }
        //인자값이 적합하지 않다면
        else {
            var center = CameraUtil.screenCenterToDegrees(); //브라우저 창 center 지점에 대한 좌표값 취득
            tempArray[0] = Number(center[0].toFixed(10));
            tempArray[1] = Number(center[1].toFixed(10));
        }

        //경위도가 정의되지 않은 경우 처리 중지
        if (!Cesium.defined(tempArray[0]) && !Cesium.defined(tempArray[1])) {
            return;
        }
        //고도가 정의되지 않은 경우 기본 값 지졍
        else if (!Cesium.defined(tempArray[2])) {
            tempArray[2] = 1000;
        }

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(tempArray[0], tempArray[1], tempArray[2]),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-90)
            },
            duration: 2, //카메라 이동 시작~종료 시간(초)
            easingFunction: Cesium.EasingFunction.SINUSOIDAL_IN_OUT, //카메라가 움직이는 기법
            complete: function () {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
    }
    /**
     *  화면 우측 상단 주소 검색창 이벤트
     */
    //==주소 검색 버튼 클릭 이벤트 등록 START
    document.getElementById("search-button").addEventListener('click',
        async function() {
            var entity = viewer.entities.getById("searchEntity");
            /*if (entity !== undefined) {
                viewer.entities.remove(entity);
            }*/
            var addrDatas = await searchAddr(document.getElementById('search-address').value);

            var areaParent = document.getElementById('result-area');
            var origin = areaParent.firstElementChild.cloneNode();
            areaParent.replaceChildren();
            areaParent.appendChild(origin);
            for (var key in addrDatas) {
                var copyObj = origin.cloneNode();
                copyObj.setAttribute('class', 'cesium-result-box appear');
                copyObj.innerHTML = addrDatas[key].displayName;
                copyObj.setAttribute('data-lat', addrDatas[key].lat);
                copyObj.setAttribute('data-lon', addrDatas[key].lon);
                copyObj.setAttribute('data-destination', addrDatas[key].destination);

                areaParent.append(copyObj);
            }
            console.log(areaParent);
        });
    //==주소 검색 버튼 클릭 이벤트 등록 END

    //==주소 입력 후 엔터 누를 시 검색 이벤트 등록 START
    $('#search-address').keypress(function(e) {
        if (e.keyCode && e.keyCode == 13) {
            $("#search-button").trigger("click");
            return false;
        }
    });
    //==주소 입력 후 엔터 누를 시 검색 이벤트 등록 END

    //==주소 검색 결과값 목록 호출 함수 START
    async function searchAddr(input) {
        var pattern = /\s/g;   // 공백 체크 정규표현식 - 탭, 스페이스
        var reverseFlag = true;
        var queryString = 'https://nominatim.openstreetmap.org/search';

        if (input.match(pattern)) {
            var inputArray = input.split(' ');

            for (var n in inputArray) {
                if (isNaN(n)) {
                    reverseFlag = false;
                    break;
                }
            }
            if (reverseFlag) {
                input = inputArray[1] + " " + inputArray[0];
            }
        }


        var resource = new Cesium.Resource({
            url: queryString,
            queryParameters: {
                format: 'json',
                q: input
            }
        });
        console.log(resource);
        return resource.fetchJson().then(

            function(results) {
                var nameList = '';
                console.log("results");
                console.log(results);
                return results.map(function(resultObject) { //$.each 랑 비슷한 역할
                    nameList = (resultObject.display_name).split(', ');
                    nameList.reverse();
                    var name = '';
                    for (let n of nameList) {
                        name += n + ' ';
                    }
                    return {
                        displayName: name,
                        destination: resultObject.boundingbox,
                        lon: resultObject.lon,
                        lat: resultObject.lat
                    };
                });
            });
    };
    //==주소 검색 결과값 목록 호출 함수 END

    //==주소 클릭 이벤트 START
    $(document).on('click', 'div.cesium-result-box', function(e) {
        var $eventTarget = $(e.target) //127 x(경도) 36 y(위도)
        var xpos = $eventTarget.attr('data-lon');
        var ypos = $eventTarget.attr('data-lat');
        var destination = $eventTarget.attr('data-destination');
        var addrName = $eventTarget.html();
        console.log(addrName);
        $('#search-address').val(addrName);

        showBoundary(destination);

        var areaParent = document.getElementById('result-area');
        var origin = areaParent.firstElementChild.cloneNode();
        areaParent.replaceChildren();
        areaParent.appendChild(origin);
    });
    //==주소 클릭 이벤트 END

    //==선택한 주소의 바운딩 박스 표시하기 START
    function showBoundary(bboxDegrees) {
        var bboxList = bboxDegrees.split(',');
        /*		var BoundingRectangle = Cesium.BoundingRectangle.fromRectangle(destination);*/
        const rectangle = Cesium.Rectangle.fromDegrees(
            bboxList[2], bboxList[0],
            bboxList[3], bboxList[1]
        );
        // Show the rectangle.  Not required; just for show.
        viewer.entities.add({
/*            id: "searchEntity",*/
            rectangle: {
                coordinates: rectangle,
                material: Cesium.Color.WHITE.withAlpha(0.3)
                /*fill: false,
                outline: true,
                outlineColor: Cesium.Color.WHITE*/
            },
        });
        viewer.camera.setView({
            destination: rectangle
        });
    }
    //==선택한 주소의 바운딩 박스 표시하기 END


    //geoServer의 wms 로드해서 보여주기
    function showWms() {
        var imageryProvider = new Cesium.WebMapServiceImageryProvider({
            url: 'http://175.116.181.30:8090/geoserver/wms',
            layers: 'sig',
            parameters: {
                transparent: 'true',
                format: 'image/png',
                CQL_FILTER : "SIG_KOR_NM LIKE '용인시%'"
            }
        });
        var imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
    }
    showWms();

    var imageryProvider22
    // function showWMSNotFlyingArea() {
        let data = "SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=lt_c_aisuac,lt_c_aisaltc,lt_c_aisfldc&STYLES=lt_c_aisuac,lt_c_aisaltc,lt_c_aisfldc&CRS=EPSG:4326&BBOX=126.51704986130812,36.89377501638313,127.84811314551632,38.24234375366507&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=false&BGCOLOR=0xFFFFFF&EXCEPTIONS=text/xml&KEY=607881A5-BDAE-3E58-90EB-76544C8195D9&DOMAIN=http://175.116.181.30";
        $.ajax({
            url: 'http://api.vworld.kr/req/wms',
            method: 'GET',
            data: data,
            dataType: 'jsonp',
            async: false,
            jsonpCallback:"myCallback",
            success: callback
            /*jsonpCallback:"parseResponse",
            success: function(response) {
                imageryProvider22 = response;
                var imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider22);
            },
            error: function(xhr, status, error) {
                console.log('통신 실패');
            }*/
        });
    // }

    // $.getJSON(url + "?callback=?", data, callback);

    function showWMSNotFlyingArea1() {
        var imageryProviderEx = new Cesium.WebMapServiceImageryProvider({
            url: 'http://api.vworld.kr/req/wms?',
            parameters: {
                REQUEST: 'GetMap',
                layers: 'lt_c_aisuac',
                STYLES: 'lt_c_aisuac',
                KEY: '607881A5-BDAE-3E58-90EB-76544C8195D9',
                DOMAIN:"http://175.116.181.30",
                FORMAT: "image/png",
                WIDTH:512,
                HEIGHT:512,
                BBOX:"33,124,43,132",
                server: "http://175.116.181.30"
            }
        });
        var imageryLayerEx = viewer.imageryLayers.addImageryProvider(imageryProviderEx);
    }
    showWMSNotFlyingArea1();

    //==토큰 요청 함수 START
    /*function getToken() {
        $.ajax({
            type: 'GET',
            url: 'https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json?consumer_secret=' + secretKey + '&consumer_key=' + consumerKey,
            async: false
        }).done((result) => {
            var resObj = JSON.parse(result);
            if (resObj.errMsg == 'Success') {
                console.log(result);
                console.log(resObj);
                accessToken = resObj.result.accessToken;
                accessTimeout = new Date(resObj.result.accessTimeout);
                console.log(accessToken);
            } else {
                console.log(resObj.errMsg);
                alert('재시도하세요');
            }
        });
    }

    //==axios 로 외부 api에 좌표값 요청 함수 START
    function getLonLatByAddress(addr) {
        var now = new Date();
        if (accessToken != undefined) {
            getToken();
        } else if (now > accessTimeout) {
            getToken();
        }
        var settings = {
            "url": 'https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json?accessToken=' + accessToken + '&address=' + addr,
            "method": "GET"
        };

        $.ajax(settings).done(function(response) {
            console.log(response);
        });

    }
    //==axios 로 외부 api에 좌표값 요청 함수 END*/

    /**
     *  좌표변환을 위한 함수 - 날씨 API
     */
    var RE = 6371.00877; // 지구 반경(km)
    var GRID = 5.0; // 격자 간격(km)
    var SLAT1 = 30.0; // 투영 위도1(degree)
    var SLAT2 = 60.0; // 투영 위도2(degree)
    var OLON = 126.0; // 기준점 경도(degree)
    var OLAT = 38.0; // 기준점 위도(degree)
    var XO = 43; // 기준점 X좌표(GRID)
    var YO = 136; // 기준점 Y좌표(GRID)

// LCC DFS 좌표변환 ( code : "toXY"(위경도->좌표, v1:위도, v2:경도), "toLL"(좌표->위경도,v1:x, v2:y) )
    function dfs_xy_conv(code, v1, v2) {
        var DEGRAD = Math.PI / 180.0;
        var RADDEG = 180.0 / Math.PI;

        var re = RE / GRID;
        var slat1 = SLAT1 * DEGRAD;
        var slat2 = SLAT2 * DEGRAD;
        var olon = OLON * DEGRAD;
        var olat = OLAT * DEGRAD;

        var sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);
        var rs = {};
        if (code == "toXY") {
            rs['lat'] = v1;
            rs['lng'] = v2;
            var ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
            ra = re * sf / Math.pow(ra, sn);
            var theta = v2 * DEGRAD - olon;
            if (theta > Math.PI) theta -= 2.0 * Math.PI;
            if (theta < -Math.PI) theta += 2.0 * Math.PI;
            theta *= sn;
            rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
            rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
        } else {
            rs['x'] = v1;
            rs['y'] = v2;
            var xn = v1 - XO;
            var yn = ro - v2 + YO;
            ra = Math.sqrt(xn * xn + yn * yn);
            if (sn < 0.0) -ra;
            var alat = Math.pow((re * sf / ra), (1.0 / sn));
            alat = 2.0 * Math.atan(alat) - Math.PI * 0.5;

            if (Math.abs(xn) <= 0.0) {
                theta = 0.0;
            } else {
                if (Math.abs(yn) <= 0.0) {
                    theta = Math.PI * 0.5;
                    if (xn < 0.0) -theta;
                } else theta = Math.atan2(xn, yn);
            }
            var alon = theta / sn + olon;
            rs['lat'] = alat * RADDEG;
            rs['lng'] = alon * RADDEG;
        }
        return rs;
    }

    /**
     * 단기예보 API 호출 함수
     */
    const key = "ZffRhqt27fKalGbMhWpa1df76cufI8qua61HxT7Cp1BsPonXft4Gs2cOFih5EFvcFs2Ce1y6%2B%2F3qXU2QBtLugA%3D%3D";
    function showDefaultWeather(x, y) {
        const today = new Date();

        var options = {hour: '2-digit', hour12: false};
        var formattedTime = today.toLocaleTimeString("en-US", options);

        options = {year: 'numeric', month: '2-digit', day: '2-digit'};
        var tmpDate = today.toLocaleDateString("ko-KR", options);
        tmpDate = tmpDate.replaceAll(". ", "");
        var formattedDate = tmpDate.slice(0, 8);

        const formattedR = formattedTime === "00" ? 0 : Number(formattedTime) % 3;

        var tmpTime = Number(formattedTime);
        tmpTime -= (formattedR + 1);

        if (tmpTime < 0) {
            tmpTime += 24;
            const clone = new Date(today);
            clone.setDate(today.getDate() - 1);
            tmpDate = clone.toLocaleDateString("ko-KR", options);
            tmpDate = tmpDate.replaceAll(". ", "");
            formattedDate = tmpDate.slice(0, 8);
        }

        formattedTime = tmpTime.toString();
        formattedTime = formattedTime.padStart(2, '0');

        var url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=' + key + '&numOfRows=50&pageNo=1&dataType=JSON&base_date=' + formattedDate + '&base_time=' + formattedTime + '00&nx=' + x + '&ny=' + y;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
        xhr.onload = function () {
            if (xhr.status === 200) {
                let resObj = JSON.parse(xhr.responseText);
                console.log(resObj);
                if (resObj.response.header.resultCode === '00') {
                    let resAll = resObj.response.body.items.item;
                    console.log(resAll);
                    /*dataFilter(resAll);*/
                    const today = new Date();
                    let options = {hour: '2-digit', hour12: false};
                    const formattedTime = today.toLocaleTimeString("en-US", options);

                    let nowTime = formattedTime + "00";
                    let timeArr = [];
                    let weatherArr = ["TMP", "POP", "PCP", "SKY", "PTY", "SNO", "REH", "VEC", "WSD"]; //VEC pe-is-w-wind-cone 풍향, WSD pe-is-w-wind-2 픙속
                    let time = Number(nowTime);
                    let resArr = new Object();
                    let idx = 0;

                    for (let i = 0; i < 2; i++) {
                        let tmpTime = time + (i * 100)
                        if (tmpTime >= 2400) {
                            tmpTime -= 2400;
                        }
                        timeArr.push(tmpTime.toString().padStart(4, '0'));
                    }
                    console.log(timeArr);

                    for (const key in resAll) {
                        if (timeArr.includes(resAll[key].fcstTime) && weatherArr.includes(resAll[key].category)) {
                            /* 기온℃ TMP, 강수확률% POP, 강수량-범주 (1 mm) PCP, 하늘상태 SKY, 강수형태 PTY, 적설량-범주(1 cm) SNO, 습도% REH */
                            /* "SKY", 하늘상태 / 맑음(1), 구름많음(3), 흐림(4) */
                            /* "PTY", 강수형태 / 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4) */
                            resArr[idx] = resAll[key];
                            idx += 1;
                        }
                    }
                    console.log(resArr);
                    let baseDate = resArr[0].baseDate;
                    let baseTime = resArr[0].baseTime;

                    let baseStandard = new Date(baseDate.slice(0, 4), Number(baseDate.slice(4, 6)) - 1, baseDate.slice(6, 8), baseTime.slice(0, 2), 0, 0, 0);
                    options = {month: 'long', day: 'numeric', hour: 'numeric', hour12: false};
                    let noticeTime = baseStandard.toLocaleDateString("ko-KR", options);
                    $("span#weather-standard").html(noticeTime);

                    for (const key in resArr) {
                        let standard = "";
                        let time = resArr[key].fcstTime;
                        if (time === nowTime) {
                            standard = "start";
                        } else {
                            standard = "end";
                        }

                        switch (resArr[key].category) {
                            case 'TMP' :
                                $("div#" + standard + "-temperature").html("<i class='pe-is-w-thermometer-3 pe-va weather-detail-icon pe-2'></i><div class='weather-detail-icon'>" + resArr[key].fcstValue + " ℃</div>");
                                break;
                            case 'POP' :
                                $("div#" + standard + "-probability-of-rain").html("<i class='pe-is-w-umbrella pe-va pop-icon'></i>" + resArr[key].fcstValue + " %");
                                break;
                            case 'SKY' : //weather-start-icon
                                if (resArr[key].fcstValue === "1") {
                                    //맑음
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-sun-1");
                                } else if (resArr[key].fcstValue === "3") {
                                    //구름 많음
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-mostly-cloudy-2");
                                } else if (resArr[key].fcstValue === "4") {
                                    //흐림
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-mostly-cloudy-1-f");
                                }
                                break;
                            case 'PTY' : //강수형태
                                if (resArr[key].fcstValue === "1") {
                                    //비
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-heavy-rain-1");
                                } else if (resArr[key].fcstValue === "2") {
                                    // 비/눈
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-rain-and-snow");
                                } else if (resArr[key].fcstValue === "3") {
                                    //눈
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-snow");
                                } else if (resArr[key].fcstValue === "4") {
                                    //소나기
                                    $("i#weather-" + standard + "-icon").attr("class", "weather-icon mb-2 pe-is-w-heavy-rain-2");
                                }
                                break;
                            case 'PCP' :
                                if (resArr[key].fcstValue === "강수없음") {
                                    $("div#" + standard + "-amount-of-rain").html("<i class='pe-is-w-drop pe-va weather-detail-icon'></i><div class='weather-detail-icon'>0.0 mm</div>");
                                } else {
                                    $("div#" + standard + "-amount-of-rain").html("<i class='pe-is-w-drop pe-va weather-detail-icon'></i><div class='weather-detail-icon'>" + resArr[key].fcstValue + "</div>");
                                }
                                break;
                            case 'REH' :
                                $("div#" + standard + "-humidity").html("<i class='pe-is-w-drop-percentage-f pe-va weather-detail-icon'></i><div class='weather-detail-icon'>" + resArr[key].fcstValue + " %</div>");
                                break;
                            case 'SNO' :
                                if (resArr[key].fcstValue === "적설없음") {
                                    $("div#" + standard + "-amount-of-snow").html("<i class='pe-is-w-snowflake pe-va weather-detail-icon weather-detail-snow'></i><div class='weather-detail-icon'>0.0 cm</div>");
                                } else {
                                    $("div#" + standard + "-amount-of-snow").html("<i class='pe-is-w-snowflake pe-va weather-detail-icon weather-detail-snow'></i><div class='weather-detail-icon'>" + resArr[key].fcstValue +"</div>" );
                                }
                                break;
                            case 'VEC' : //VEC pe-is-w-wind-cone 풍향, WSD pe-is-w-wind-2 픙속
                                let degree = resArr[key].fcstValue;
                                let direction = Math.floor((Number(degree) + (22.5*0.5)) /22.5);

                                let directionKor = "";
                                switch (direction) {
                                    case 0 :
                                        directionKor = "북"; //N
                                        break;
                                    case 1 :
                                        directionKor = "북북동"; //"NNE"
                                        break;
                                    case 2 :
                                        directionKor = "북동"; //"NE"
                                        break;
                                    case 3 :
                                        directionKor = "동북동"; //"ENE"
                                        break;
                                    case 4 :
                                        directionKor = "동"; //"E"
                                        break;
                                    case 5 :
                                        directionKor = "동남동"; //"ESE"
                                        break;
                                    case 6 :
                                        directionKor = "남동"; //"SE"
                                        break;
                                    case 7 :
                                        directionKor = "남남동"; //"SSE"
                                        break;
                                    case 8 :
                                        directionKor = "남"; //"S"
                                        break;
                                    case 9 :
                                        directionKor = "남남서"; //"SSW"
                                        break;
                                    case 10 :
                                        directionKor = "남서"; //"SW"
                                        break;
                                    case 11 :
                                        directionKor = "서남서"; //"WSW"
                                        break;
                                    case 12 :
                                        directionKor = "서"; //"W"
                                        break;
                                    case 13 :
                                        directionKor = "서북서"; //"WNW"
                                        break;
                                    case 14 :
                                        directionKor = "북서"; //"NW"
                                        break;
                                    case 15 :
                                        directionKor = "북북서"; //"NNW"
                                        break;
                                    case 16 :
                                        directionKor = "북"; //"N"
                                        break;
                                }
                                directionKor += "쪽";

                                $("div#" + standard + "-wind-direction").html("<i class='pe-is-w-wind-cone pe-va weather-detail-icon'></i><div class='weather-detail-icon'>" + directionKor +"</div>");
                                break;
                            case 'WSD' :
                                let strong = resArr[key].fcstValue;
                                let strongKor = "";
                                if (strong >= 14) {
                                    strongKor = "매우 강함"
                                } else if (strong >= 9) {
                                    strongKor = "강함"
                                } else if (strong >= 4) {
                                    strongKor = "약간 강함"
                                } else if (strong < 4) {
                                    strongKor = "약함"
                                }
                                $("div#" + standard + "-wind-speed").html("<i class='pe-is-w-wind-2 pe-va weather-detail-icon'></i><div class='weather-detail-icon'>" +resArr[key].fcstValue + " m/s</div>");
                                break;
                        }
                        $("div#weather-info-" + standard + "-time").html(time.slice(0, 2) + "시");

                    }
                } else {
                    console.log(resObj.response.header);
                }
            } else {
                console.log('데이터 로드 실패');
            }
        };
        xhr.onerror = function () {
            alert('다시 시도');
        };
        xhr.send();
    }


    /**
     * 매시 정각마다 날씨 새로고침을 위한 호출 함수
     */
    function runDefaultWeatherEveryHour() {
        setInterval(function () {
            var now = new Date();
            var minutes = now.getMinutes();
            var seconds = now.getSeconds();

            // 매시 정각일 때만 showDefaultWeather 함수를 실행
            if (minutes === 0 && seconds === 0) {
                showDefaultWeather(xyArr['x'], xyArr['y']);
            }
        }, 1000); // 1초마다 실행
    }


    xyArr = dfs_xy_conv("toXY", 36.4770253283333, 127.675128746667);
    showDefaultWeather(xyArr['x'], xyArr['y']);
    runDefaultWeatherEveryHour();
    /*xyArrGps = dfs_xy_conv("toXY", 36.4770253283333, 127.675128746667);
        showDefaultWeather(xyArrGps['x'], xyArrGps['y']);*/

    /*// 과거 날씨 조회 api
    function getWeather(yy, mm, stn) {
        var arr_data = [];
        var url = "http://www.kma.go.kr/weather/observation/past_cal.jsp?stn=" + stn + "&yy=" + yy + "&mm=" + mm + "&obs=1&x=24&y=9";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        var contents = xhr.responseText;
        if (contents) {
            // euc-kr 페이지를 utf8로 변환한다.
            contents = decodeURIComponent(escape(contents));
        }
        var regex = /.*<td class="align_left">평균기온:(.*?)<br \/>최고기온:(.*?)<br \/>최저기온:(.*?)<br \/>평균운량:(.*?)<br \/>일강수량:(.*?)<br \/><\/td>.*!/;
        // 라인단위로 분리
        var arr_line = contents.split("\n");
        var day = 1; // 일 정보
        for (var i = 0; i < arr_line.length; i++) {
            var line = arr_line[i];
            if (line.indexOf("평균기온") > -1) {
                line = line.replace("℃", "").replace("mm", "");
                var matches = line.match(regex);
                arr_data[day] = {
                    'avg': matches[1], // 평균기온
                    'high': matches[2], // 최고기온
                    'low': matches[3], // 최저기온
                    'cloud': matches[4], // 평균운량
                    'rain': matches[5].replace("-", '0').trim() // 일강수량
                };
                day++;
            }
        }
        return arr_data;
    }

    // main routine
    // ====================
    var params = new URLSearchParams(window.location.search);
    var yy = params.get('yy'); // 년도
    var mm = params.get('mm'); // 월
    var stn = params.get('stn'); // 지역
    yy = yy === '' ? new Date().getFullYear().toString() : yy;
    mm = mm === '' ? (new Date().getMonth() + 1).toString() : mm;
    stn = stn === '' ? '108' : stn;
    var arr_data = getWeather(yy, mm, stn);
    console.log(JSON.stringify(arr_data));*/

    //  과거 날씨 조회 api - 날씨 정보 테이블 만들어서 하기, 현재 날씨 Table 추가
    function getOldWeather(stn, day, startTime, endTime) {
        const stnIds = stn === ""?108:stn;
        /*const key = "ZffRhqt27fKalGbMhWpa1df76cufI8qua61HxT7Cp1BsPonXft4Gs2cOFih5EFvcFs2Ce1y6%2B%2F3qXU2QBtLugA%3D%3D";*/
        let url = "https://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList?serviceKey=" + key + "&pageNo=1&numOfRows=3&dataType=JSON&dataCd=ASOS&dateCd=HR&startDt="+day+"&startHh="+startTime+"&endDt="+day+"&endHh="+endTime+"&stnIds="+stnIds;
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
        xhr.onload = function () {
            if (xhr.status === 200) {
                let resObj = JSON.parse(xhr.responseText);
                if (resObj.response.header.resultCode === '00') {
                    console.log(resObj);

                }
            };
        };
        xhr.onerror = function () {
            alert('다시 시도');
        };

        xhr.send();
    };
    let d = new Date();
    //YYYYMMDD


    let options = {hour: '2-digit', hour12: false}; //시간 세팅
    let formattedTime = d.toLocaleTimeString("en-US", options);
    let eTime = Number(formattedTime) + 1;
    getOldWeather("", "20230102", formattedTime, eTime.toString());


};
