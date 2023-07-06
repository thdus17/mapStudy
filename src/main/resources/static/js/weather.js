window.onload = ()=> {
 /*   const axios = require('axios');*/

    //  과거 날씨 조회 api
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
    /*getOldWeather("", "20230102", formattedTime, eTime.toString());*/

    /*useEffect(()=> {
        axios({
            method: "GET",
            params: {
                pageNo: 1,
                numOfRows : 3,
                dataType: "JSON",
                dataCd: "ASOS",
                dateCd: "HR",
                startDt: "20230102",
                startHh: formattedTime,
                endDt: "20230102",
                endHh: eTime.toString(),
                stnIds: 108,
            },
            url: "http://apis.data.go.kr/1360000/AsosHourlyInfoService?serviceKey="+key,
        }).then((res)=> {
            console.log(res);
            let resObj = JSON.parse(res);
            console.log(resObj);
        })
    })*/
}