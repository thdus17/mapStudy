/**
 * 
 */

window.onload = function() {
	/*	const secretKey = 'fe95f4d500344dd1a9b5';
		const consumerKey = 'ac56635afecd4d59824a';
		var accessTimeout = undefined;
		var accessToken = undefined;*/
	//내 토큰 추가
	Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMDE5YTc2Ni1mNmUxLTRjZDYtYTRiMC03YmNlMDE3MzZhODkiLCJpZCI6MTQ0NTM4LCJpYXQiOjE2ODU5NTEyNzN9.4oC0ZuLdH7F45DKUMsJg7xh-nP3lEkiLg5Q3B0s0ER8';
	const viewer = new Cesium.Viewer("cesiumContainer");
	const scene = viewer.scene;

	var searchArea = new Cesium.PrimitiveCollection();

	var CameraUtil = function() { };
	CameraUtil.flyToNormal = function(xyzArr, callback) {
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
			complete: function() {
				if (typeof callback === 'function') {
					callback();
				}
			}
		});
	}
	//==주소 검색 버튼 클릭 이벤트 등록 START
	document.getElementById("search-button").addEventListener('click',
		async function() {
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
		
		showBoundary(destination);

		if (xpos === '' || ypos === '') {
			$.notify("Not a Point of Interest", { type: "toast", color: "#00ff02", blur: 0.2 });
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



};
