/**
 *
 */

window.onload = function () {
    /*	const secretKey = 'fe95f4d500344dd1a9b5';
        const consumerKey = 'ac56635afecd4d59824a';
        var accessTimeout = undefined;
        var accessToken = undefined;*/
    //내 토큰 추가
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMDE5YTc2Ni1mNmUxLTRjZDYtYTRiMC03YmNlMDE3MzZhODkiLCJpZCI6MTQ0NTM4LCJpYXQiOjE2ODU5NTEyNzN9.4oC0ZuLdH7F45DKUMsJg7xh-nP3lEkiLg5Q3B0s0ER8';
    const viewer = new Cesium.Viewer("cesiumContainer");
    const scene = viewer.scene;

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
    //==주소 검색 버튼 클릭 이벤트 등록 START
    document.getElementById("search-button").addEventListener('click',
        async function () {
            searchArea.destroy();
            var addrDatas = await searchAddr(document.getElementById('search-address').value);
            console.log("addrDatas");
            console.log(addrDatas);

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

    //==주소 검색 결과값 목록 호출 함수 START
    async function searchAddr(input) {
        var queryString = 'https://nominatim.openstreetmap.org/search';
        var resource = new Cesium.Resource({
            url: queryString,
            queryParameters: {
                format: 'json',
                q: input
            }
        });
        return resource.fetchJson().then(
            function (results) {
                var nameList = '';
                console.log("results");
                console.log(results);
                return results.map(function (resultObject) { //$.each 랑 비슷한 역할
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
    $(document).on('click', 'div.cesium-result-box', function (e) {
        var $eventTarget = $(e.target) //127 x(경도) 36 y(위도)
        var xpos = $eventTarget.attr('data-lon');
        var ypos = $eventTarget.attr('data-lat');
        var destination = $eventTarget.attr('data-destination');

        showBoundary(destination);

        if (xpos === '' || ypos === '') {
            $.notify("Not a Point of Interest", {type: "toast", color: "#00ff02", blur: 0.2});
            return;
        }
        var xyzArr = [parseFloat(xpos), parseFloat(ypos), 1000];
        CameraUtil.flyToNormal(xyzArr);
        var areaParent = document.getElementById('result-area');
        var origin = areaParent.firstElementChild.cloneNode();
        areaParent.replaceChildren();
        areaParent.appendChild(origin);
    });
    //==주소 클릭 이벤트 END

    //==선택한 주소의 WMS 표시하기 START -> 바운딩 박스로 변경
    function showBoundary(bboxDegrees) {
        var bboxList = bboxDegrees.split(',');
        /*		var BoundingRectangle = Cesium.BoundingRectangle.fromRectangle(destination);*/
        searchArea = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
                geometry: new Cesium.RectangleGeometry({
                    rectangle: Cesium.Rectangle.fromDegrees(
                        bboxList[2], bboxList[0],
                        bboxList[3], bboxList[1]),
                    height: 0,
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                }),
                attributes: {
                    color: new Cesium.ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 0.3),
                },
            }),
            appearance: new Cesium.PerInstanceColorAppearance(),
        })
        scene.primitives.add(
            searchArea
        );
    }

    //==선택한 주소의 폴리곤 표시하기 END

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
    function showDefaultWeather(x, y) {
        const key = "ZffRhqt27fKalGbMhWpa1df76cufI8qua61HxT7Cp1BsPonXft4Gs2cOFih5EFvcFs2Ce1y6%2B%2F3qXU2QBtLugA%3D%3D";
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
                if (resObj.response.header.resultCode === '00') {
                    let resAll = resObj.response.body.items.item;
                    console.log(resAll);
                    /*dataFilter(resAll);*/
                    const today = new Date();
                    let options = {hour: '2-digit', hour12: false};
                    const formattedTime = today.toLocaleTimeString("en-US", options);

                    let nowTime = formattedTime + "00";
                    let timeArr = [];
                    let weatherArr = ["TMP", "POP", "PCP", "SKY", "PTY", "SNO", "REH"];
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
                                $("div#" + standard + "-temperature").html("<i class='pe-is-w-thermometer-3 pe-va weather-detail-icon pe-2'></i>" + resArr[key].fcstValue + " ℃");
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
                                    $("div#" + standard + "-amount-of-rain").html("<i class='pe-is-w-drop pe-va weather-detail-icon'></i>0.0 mm");
                                } else {
                                    $("div#" + standard + "-amount-of-rain").html("<i class='pe-is-w-drop pe-va weather-detail-icon'></i>" + resArr[key].fcstValue);
                                }
                                break;
                            case 'REH' :
                                $("div#" + standard + "-humidity").html("<i class='pe-is-w-drop-percentage-f pe-va weather-detail-icon'></i>" + resArr[key].fcstValue + " %");
                                break;
                            case 'SNO' :
                                if (resArr[key].fcstValue === "적설없음") {
                                    $("div#" + standard + "-amount-of-snow").html("<i class='pe-is-w-snowflake pe-va weather-detail-icon weather-detail-snow'></i>0.0 cm");
                                } else {
                                    $("div#" + standard + "-amount-of-snow").html("<i class='pe-is-w-snowflake pe-va weather-detail-icon weather-detail-snow'></i>" + resArr[key].fcstValue);
                                }
                                break;
                        }
                        $("div#weather-info-" + standard + "-time").html(time.slice(0, 2) + " 시");

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
                showDefaultWeather(xyArrGps['x'], xyArrGps['y']);
            }
        }, 1000); // 1초마다 실행
    }


    let xyArr = dfs_xy_conv("toXY", 36.4770253283333, 127.675128746667);
    showDefaultWeather(xyArr['x'], xyArr['y']);
    runDefaultWeatherEveryHour();
/*xyArrGps = dfs_xy_conv("toXY", 36.4770253283333, 127.675128746667);
	showDefaultWeather(xyArrGps['x'], xyArrGps['y']);*/
};
