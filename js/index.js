let appData = {};
let adhanStatus = {};

chrome.runtime.onMessage.addListener((msg) => { if ('runApp' in msg) { runApp() } });

$(function () {
    goGoRun('1stLoad');
    setInterval(goGoRun, 1000);
});

const goGoRun = (info) => {
    navigator.serviceWorker.controller.postMessage({ goGoRun: (info ?? '') })
}

const runApp = async () => {

    appData = (await chrome.storage.local.get(['appData'])).appData;

    let asResult = await chrome.storage.local.get(['adhanStatus']);
    if (asResult.adhanStatus)
        adhanStatus = asResult.adhanStatus;

    $('#clock').attr("src", appData.clock);
    $('.menu-clock-img').attr("src", appData.icon);
    $('#iconImg').attr("src", appData.icon);
    $('#barImg').attr("src", appData.bar);

    $('#elapsedText').html(appData.elapsedText);
    $('#nextText').css("background-color", appData.iconColor);
    $('#nextText').css("color", appData.iconTextColor);
    $('#nextText').html(appData.nextText);
    $('#ntTitle').html(appData.nextTextTitle);

    $('#todaysDate').text(appData.todaysDate);
    $('.todaysDateArabic').text(appData.todaysDateArabic);

    $('#remainingForIftar').hide();
    if (appData.remainingForIftar) {
        $('#remainingForIftar').html(appData.remainingForIftar).show();
    }

    Object.entries(appData.i18n).forEach(function ([key, value]) {
        $('#' + key).text(value);
        $('.' + key).text(value);
    });

    $('.vakitDiv').hide();
    for (let i = 0; i < appData.appVakits.length; i++) {
        let vakit = appData.appVakits[i].name.toLowerCase();
        let vd = $('.' + vakit + 'Div');
        let timeValue = appData.appVakits[i].displayTime;

        if (vakit === "duha") {
            let duhaend = appData.allVakits.find(f => f.name === 'Duhaend');
            let duhaendTime = duhaend.displayTime;
            timeValue += " - " + duhaendTime;
        }

        let dTitle = '';
        if (vakit === "midnight")
            dTitle = "2/3 @ " + appData.twoThirdTime;

        let vakitText = appData.i18n[vakit + 'Text'];
        if (appData.isJumua && vakit === 'dhuhr')
            vakitText = appData.i18n.jumuaText

        vd.html(`
                <div class="pt-1 small" title="${dTitle}">
                    ${vakitText}
                </div>
                <div class="p-1 vakitTime" title="${dTitle}">
                    ${timeValue}
                </div>
            `);

        let cClass = 'bg-dark border border-light rounded';
        vd.removeClass(cClass);
        if (appData.appVakits[i].isCurrentVakit == 1) {
            vd.addClass(cClass);
        }

        if (i < Math.ceil(appData.appVakits.length / 2))
            $('#vakitsRow1').append(vd);
        else
            $('#vakitsRow2').append(vd);
        vd.show();
    }

    for (let i = 0; i < appData.allVakits.length; i++) {
        let vakit = appData.allVakits[i].name.toLowerCase();
        $('#offset-' + vakit).html(appData.allVakits[i].displayTime);
    }

    setFields();

}

$(function () {

    $("#menu-div-clock").click(function (e) {
        $('.menu-div').removeClass('bg-secondary');
        $('#menu-div-clock').addClass('bg-secondary');
        $('.tabDiv').hide();
        $('#times').show();
        $('#footer').show();
        $('.fdate').show();
    });

    $(".menu-settings").click(function (e) {
        $('.menu-div').removeClass('bg-secondary');
        $('#menu-div-settings').addClass('bg-secondary');
        $('.tabDiv').hide();
        $('#basicSettings').show();
        $('#footer').show();
        $('.fdate').hide();
    });

    $(".menu-adhans-offsets").click(function (e) {
        $('.menu-div').removeClass('bg-secondary');
        $('#menu-div-adhans-offsets').addClass('bg-secondary');
        $('.tabDiv').hide();
        $('#adhanOffsetSettings').show();
        $('#footer').hide();
    });

    $("#calculationMethod").change(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.calculationMethod = $('#calculationMethod').val();
            saveAppDataAndRefresh(appData);
        });
    });

    $("#desktopNotificationsToggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.desktopNotifications = !appData.settings.desktopNotifications;
            saveAppDataAndRefresh(appData);
            chrome.notifications.clear('test');
            if (appData.settings.desktopNotifications) {
                chrome.notifications.create(
                    'test',
                    {
                        type: "image",
                        imageUrl: 'images/notification.jpg',
                        iconUrl: 'images/icons/128.png',
                        title: appData.i18n['desktopNotificationsOnTitle'],
                        message: appData.settings.address
                    }
                );
                chrome.storage.local.set({ 'lastAlert': 'settingUpdate' });
            }
        });
    });

    $("#showImsakToggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.showImsak = !appData.settings.showImsak;
            saveAppDataAndRefresh(appData);
        });
    });

    $("#showDuhaToggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.showDuha = !appData.settings.showDuha;
            saveAppDataAndRefresh(appData);
        });
    });

    $("#showMidnightToggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.showMidnight = !appData.settings.showMidnight;
            saveAppDataAndRefresh(appData);
        });
    });

    $("#hour24Toggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.timeFormat = (appData.settings.timeFormat == 12) ? 24 : 12;
            saveAppDataAndRefresh(appData);
        });
    });

    $(".adhansToggle").click(function () {
        navigator.serviceWorker.controller.postMessage({ endAdhanCall: true });
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.areAdhansEnabled = !appData.settings.areAdhansEnabled;
            saveAppDataAndRefresh(appData);
            displayAdhansAndOffsets();
        });
    });

    $("#hanafiAsrToggle").click(function () {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.hanafiAsr = !appData.settings.hanafiAsr;
            saveAppDataAndRefresh(appData);
        });
    });

    $(".iconButton").click(function (e) {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.iconStyle = e.currentTarget.value;
            saveAppDataAndRefresh(appData);
        });
    });

    $("#googleMapsButton").click(function (e) {
        window.open('https://maps.google.com/?q=' + appData.settings.address)
    });

    $(".lastHourHilite").click(function (e) {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.lastHourHilite = ((appData.lastHourHilite ?? 0) + 1) % 2;
            saveAppDataAndRefresh(appData);
        });
    });

    $("#addressForm").submit(function (event) {

        event.preventDefault();
        showLoading();
        $('#addressButton').attr('disabled', true);

        chrome.storage.local.get(['appData'], function (result) {

            appData = result.appData;

            let ceCallURL = 'https://smartazanclock.com/geosettings?address=' + $('#address').val();

            fetch(ceCallURL, { method: 'POST' }).then((response) => {
                if (response.status == 200) {
                    response.json().then((data) => {

                        settingsCodeFields.forEach(field => {
                            if (field in data) {
                                appData.settings[field] = data[field];
                            }
                        });

                        chrome.storage.local.set({ 'appData': appData }, () => {
                            goGoRun('address updated');
                            $('#address').val(appData.settings.address);
                            $('#addressButton').attr('disabled', false);
                            $('#loadingImg').attr('src', '/images/check.png');
                            $(':focus').blur();
                            hideLoadingOnSuccess();
                        });
                    });
                }
                else
                    addressSearchFail()

            }).catch((err) => { addressSearchFail() });

        });

    });

    $("#hijriDateIncrease").click(function (e) {
        saveHijriDateOffset('+');
    });

    $("#hijriDateDecrease").click(function (e) {
        saveHijriDateOffset('-');
    });

    $("#displayLanguage").change(function (e) {
        let code = e.target.value;
        let i18nValues = {};
        let lang = languages.some(f => f.code == code) ? code : 'en';
        fetch('_locales/' + lang + '/messages.json').then((response) => {
            response.json().then((data) => {
                Object.entries(data).forEach(([key, value]) => { i18nValues[key] = value.message });
                appData.i18n = i18nValues;
                saveAppDataAndRefresh(appData);
                displayAdhansAndOffsets();
            });
        });
    });

    $("#appResetButton").click(function (e) {
        document.getSelection().removeAllRanges();
        navigator.serviceWorker.controller.postMessage({ endAdhanCall: true });
        adhanStatus = {};
        showLoading();
        chrome.storage.local.clear();
        goGoRun('extension reset');
        setTimeout(() => {
            $("#menu-div-clock").trigger("click");
            hideLoadingOnSuccess();
        }, 2000);
    });

    $("#reviewButton").click(function (e) {
        window.open('https://chromewebstore.google.com/detail/prayer-times-chrome-exten/fbkmgnkliklgbmanjkmiihkdioepnkce/reviews');
    });

    $("#audioPlayerDiv").click(function (e) {
        stopAudio();
    });

    $("#stopAdhanDiv").click(() => {
        navigator.serviceWorker.controller.postMessage({ endAdhanCall: true });
    });

    $("#settingsCodeButton").click(async function () {
        const $button = $(this);
        if ($button.prop('disabled')) return;
        let originalButtonText = $button.html();
        $button.prop('disabled', true);
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            const requestOptions = { method: "POST", headers: myHeaders, body: JSON.stringify(appData.settings) };
            const response = await fetch("https://smartazanclock.com/settings-code", requestOptions);
            const data = await response.json();
            const backupCode = data.id;
            await navigator.clipboard.writeText(backupCode);
            $button.html(`
                    <span><img src="images/check-mini.png" /></span>
                    <span>${backupCode} <small>${appData.i18n.copiedText}</small></span>
                `);
        } catch (err) {
            $button.html('Error!');
        } finally {
            setTimeout(() => {
                $button.html(originalButtonText);
                $button.prop('disabled', false);
            }, 1200);
        }
    });

    let scb = document.getElementById('settingsCodeButton');
    let tooltip = bootstrap.Tooltip.getOrCreateInstance(scb, { trigger: 'hover', customClass: 'custom-tooltip' });
    scb.addEventListener('show.bs.tooltip', () => {
        const currentContent = tooltip._config.title;
        if (currentContent !== appData.i18n.settingsCodeInfo) {
            tooltip._config.title = appData.i18n.settingsCodeInfo;
        }
    });

    let arb = document.getElementById('appResetButton');
    let tooltipAR = bootstrap.Tooltip.getOrCreateInstance(arb, { trigger: 'hover', customClass: 'custom-red-tooltip' });
    arb.addEventListener('show.bs.tooltip', () => {
        tooltipAR._config.title = 'Reset Version ' + chrome.runtime.getManifest().version;
    });

    let rvb = document.getElementById('reviewButton');
    let tooltipRV = bootstrap.Tooltip.getOrCreateInstance(rvb, { trigger: 'hover', customClass: 'custom-tooltip' });
    rvb.addEventListener('show.bs.tooltip', () => {
        tooltipRV._config.title = 'Review';
    });

});

document.addEventListener('click', function (event) {

    if (event.target && event.target.classList.contains('playAudioButton')) {
        playAudio(appData.settings.adhans[event.target.dataset.vakit]);
    }

    if (event.target && event.target.classList.contains('adhanRecitorBtn')) {
        let isVisible = $('#adhanRow' + event.target.dataset.name).is(':visible')
        $('.adhanRow').slideUp();
        if (!isVisible) {
            $('#adhanRow' + event.target.dataset.name).slideToggle();
        }
    }

    if (event.target && event.target.classList.contains('offsetIncrease')) {
        let vakit = event.target.dataset.vakit;
        saveOffset(vakit, '+');
    }

    if (event.target && event.target.classList.contains('offsetDecrease')) {
        let vakit = event.target.dataset.vakit;
        saveOffset(vakit, '-');
    }

});

document.getElementById('adhanOffsetSettings').addEventListener('change', function (event) {
    if (event.target && event.target.matches('select.adhanDD')) {
        chrome.storage.local.get(['appData'], function (result) {
            appData = result.appData;
            appData.settings.adhans[event.target.dataset.name] = event.target.value * 1;
            saveAppDataAndRefresh(appData);
            if (event.target.value != 0) {
                $('#adhanRow' + event.target.dataset.name).removeClass('d-none');
            }
        });
    }
});

document.getElementById('volume').addEventListener('change', function (event) {
    chrome.storage.local.get(['appData'], function (result) {
        appData = result.appData;
        appData.settings.volume = event.target.value * 1;
        saveAppDataAndRefresh(appData);
        playAudio(102);
    });
});

const saveAppDataAndRefresh = (appData) => {
    chrome.storage.local.set({ 'appData': appData }, function () {
        goGoRun('appData updated');
        $(':focus').blur();
    });
}

const setFields = async () => {

    $('#stopAdhanDiv').hide();
    if (adhanStatus.isBeingCalled)
        $('#stopAdhanDiv').show();

    if (!$('#basicSettings').is(':visible'))
        $('#address').val(appData.settings.address);

    let topAddressMaxLen = 13;
    let topAddress = appData.settings.address.substring(0, topAddressMaxLen) + ((appData.settings.address.length > topAddressMaxLen) ? '…' : '');
    $('#addressMenuText').html(topAddress);
    $('.timeNowTitle').html(appData.timeNow).attr('title', 'Current Time in ' + appData.settings.timeZoneID);
    $('#calculationMethod').val(appData.settings.calculationMethod);

    $('#fajrAngle').html(appData.i18n['fajrText'] + ' ' + appData.fajrAngle);
    $('#ishaAngle').html(appData.i18n['ishaText'] + ' ' + appData.ishaAngle);

    $('.iconButton').removeClass('btn-primary').addClass('btn-darkish');
    $('#' + appData.settings.iconStyle.toLowerCase() + 'Button').removeClass('btn-darkish').addClass("btn-primary");

    $('#desktopNotificationsOn').hide();
    $('#desktopNotificationsOff').hide();
    if (appData.settings.desktopNotifications)
        $('#desktopNotificationsOn').show();
    else
        $('#desktopNotificationsOff').show();

    $('.hanafiAsrOption').hide();
    if (appData.settings.hanafiAsr)
        $('#hanafiAsrOn').show();
    else
        $('#hanafiAsrOff').show();

    $('.showImsakOption').hide();
    if (appData.settings.showImsak) {
        $('#showImsakOn').show();
    }
    else {
        $('#showImsakOff').show();
    }

    $('.showDuhaOption').hide();
    if (appData.settings.showDuha) {
        $('#showDuhaOn').show();
    }
    else {
        $('#showDuhaOff').show();
    }

    $('.showMidnightOption').hide();
    if (appData.settings.showMidnight) {
        $('#showMidnightOn').show();
    }
    else {
        $('#showMidnightOff').show();

    }

    $('.hour24Option').hide();
    if (appData.settings.timeFormat == 12) {
        $('#hour24Off').show();
    }
    else {
        $('#hour24On').show();
    }

    $('.lastHourHilite').hide();
    if (appData.settings.isLastHour) {
        if (appData.lastHourHilite == 0) {
            $('#lastHourHiliteOff').show();
        }
        else {
            $('#lastHourHiliteOn').show();
        }
    }

    const dispLang = document.getElementById('displayLanguage');
    dispLang.innerHTML = '';
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language.code;
        option.textContent = language.name;
        option.selected = appData.i18n.languageCode == language.code;
        option.classList.add(`flag-${language.code}`)
        dispLang.appendChild(option);
    });

    const calculationMethod = document.getElementById('calculationMethod');
    calculationMethod.innerHTML = '';
    methods.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.name;
        if (appData.settings.calculationMethod == m.id)
            option.selected = true;
        calculationMethod.appendChild(option);
    });

    $('#audioVolumeIcon').attr('src', 'images/audio-' + appData.settings.volume + '.png');
    $('#audioVolumeDiv').attr('title', 'Audio Volume: ' + appData.settings.volume);
    if (appData.settings.areAdhansEnabled)
        $('#volume').attr('disabled', false);
    else
        $('#volume').attr('disabled', true);
    if (!$('#adhanOffsetSettings').is(':visible'))
        displayAdhansAndOffsets();

}

const displayAdhansAndOffsets = () => {

    $('#volume').val(appData.settings.volume);

    $('.offsetCurrentVakit').removeClass('offsetCurrentVakit');
    let adhanVakits = ['imsak', 'fajr', 'duha', 'duhaend', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let aoContent = `<div class="badge p-0 mt-0">${appData.i18n.adhansAndOffsetsTitle}</div>`;
    let offsetPresent = false;
    let imsakOffset = imsakDefaultOffset + (appData.settings.vakitOffsets && appData.settings.vakitOffsets.imsak ? appData.settings.vakitOffsets.imsak : 0);
    let duhaOffset = duhaDefaultOffset + (appData.settings.vakitOffsets && appData.settings.vakitOffsets.duha ? appData.settings.vakitOffsets.duha : 0);
    let duhaendOffset = duhaendDefaultOffset + (appData.settings.vakitOffsets && appData.settings.vakitOffsets.duhaend ? appData.settings.vakitOffsets.duhaend : 0);
    let currentVakit = appData.allVakits.find(f => f.isCurrentVakit).name.toLowerCase();

    $('.adhan-on').hide();
    $('.adhan-off').hide();
    if (appData.settings.areAdhansEnabled)
        $('.adhan-on').show();
    else
        $('.adhan-off').show();

    adhanVakits.forEach((v) => {
        let thisTime = appData.allVakits.find(f => f.name.toLowerCase() == v);
        let timeValue = thisTime.displayTime;
        let fajrAdhans = adhanAudios.filter(a => a.isFajrAdhan);
        let adhans = adhanAudios.filter(a => a.isAdhan);
        let thisAdhanAudioID = appData.settings.adhans[v] ?? 0;
        let thisAudioTitle = adhanAudios.find(a => a.id == thisAdhanAudioID)?.name;
        aoContent += `<div id=settingBox${v} class="bg-darkish px-1
                    ${v == 'duha' ? 'rounded-top pt-1' : (v == 'duhaend' ? 'rounded-bottom pb-1' : 'rounded py-2')}
                    ${v != 'duha' ? 'mb-1' : ''}
                    ${thisTime.isCurrentVakit || (v == 'duhaend' && currentVakit == 'duha') ? 'border-start border-3 border-light' : ''}">`;
        aoContent += `<div class="d-flex flex-row justify-content-between">`;

        aoContent += `<div class="col-4">`;
        if (v != 'duhaend')
            aoContent += `<span class="badge">${appData.i18n[v + 'Text']}</span>`;

        if (v == 'imsak')
            aoContent += `<img title="${appData.i18n.fajrText + imsakOffset}" class="img-fluid" src="/images/info.png">`

        if (v == 'duha')
            aoContent += `<img title="(${appData.i18n.sunriseText}+${duhaOffset}) - (${appData.i18n.dhuhrText}${duhaendOffset})" class="img-fluid" src="/images/info.png">`

        if (v == 'isha')
            aoContent += `<img title="${appData.i18n.midnightText} @ ${appData.allVakits[9].displayTime} - 2/3 @ ${appData.twoThirdTime}" class="img-fluid" src="/images/info.png">`

        aoContent += '</div>';

        aoContent += `<div class="col-2"><span id="offset-${v}" class="badge">${timeValue}</span></div>`

        /* offsets */

        let offsetValue = appData.settings.vakitOffsets && appData.settings.vakitOffsets[v] ? appData.settings.vakitOffsets[v] : 0;
        if (offsetValue != 0)
            offsetPresent = true;
        let stdLimit = 90;
        if (v == 'duha' || v == 'maghrib')
            stdLimit = 45;

        let increaseDisabled = false;
        let decreaseDisabled = false;

        if (offsetValue >= stdLimit)
            increaseDisabled = true;

        if (offsetValue <= -stdLimit)
            decreaseDisabled = true;

        if (v == 'imsak' && offsetValue >= 0)
            increaseDisabled = true;

        if (v == 'duha' && offsetValue <= 0)
            decreaseDisabled = true;

        if (v == 'duhaend' && offsetValue >= 0)
            increaseDisabled = true;

        if (v == 'maghrib' && offsetValue <= -3)
            decreaseDisabled = true;


        aoContent += '<div class="col-5">';
        aoContent += `
                            <div class="d-flex flex-row gap-1 justify-content-center">
                                <div><button ${decreaseDisabled ? 'disabled' : ''} class="btn btn-dark btn-xs offsetDecrease" id="${v}OffsetDecrease"
                                        data-vakit="${v}">-</button></div>
                                <div>
                                    <span id="${v}Offset" class="badge ${offsetValue != 0 ? 'bg-danger text-light' : 'bg-light text-dark'}">${offsetValue}</span>
                                </div>
                                <div>
                                    <button ${increaseDisabled ? 'disabled' : ''} class="btn btn-dark btn-xs offsetIncrease" id="${v}OffsetIncrease"
                                        data-vakit="${v}">+</button>
                                </div>
                            </div>
            `;
        aoContent += '</div>';
        /* offsets, end */

        /* adhan settings */
        if (appData.settings.adhans.hasOwnProperty(v)) {
            aoContent += `<div class="col-1">`;
            aoContent += `<img title='${thisAudioTitle}' class="${appData.settings.areAdhansEnabled ? 'adhanRecitorBtn pointerOn' : ''} ms-1 img-fluid" data-name=${v} src="images/mic${appData.settings.areAdhansEnabled ? '' : '-na'}.png"/>`;
            aoContent += `</div>`;
        }
        else {
            aoContent += `<div class="col-1"></div>`;
        }
        /* adhan settings, end */

        aoContent += '</div>';

        if (appData.settings.adhans.hasOwnProperty(v)) {

            aoContent += `<div class="adhanRow" id="adhanRow${v}" style="display:none;">`
            aoContent += `<div class="d-flex flex-row gap-1 mt-2 px-1 justify-content-between align-items-center">`
            aoContent += `<div class="flex-fill">`
            aoContent += `<select class="form-control form-control-sm adhanDD" 
                                data-name="${v}">
                                `;
            if (v == 'fajr') {
                fajrAdhans.forEach(a => {
                    aoContent += `<option ${thisAdhanAudioID == a.id ? "selected" : ""} value=${a.id}>${a.name}</option>`
                })
            }
            else {
                adhans.forEach(a => {
                    aoContent += `<option ${thisAdhanAudioID == a.id ? "selected" : ""} value=${a.id}>${a.name}</option>`
                })
            }
            aoContent += "</select>";
            aoContent += "</div>";

            aoContent += `<div><img src="images/play.png" class="playAudioButton pointer p-1 rounded" data-vakit="${v}" data-title="${thisAudioTitle}" /></div>`;

            aoContent += '</div>';
            aoContent += '</div>';

        }

        aoContent += '</div>';

    });

    let hijriDateOffset = appData.settings.hijriDateOffset ?? 0;

    $('#hijriDateOffset').html(hijriDateOffset);
    $('#hijriDateIncrease').attr("disabled", false);
    $('#hijriDateDecrease').attr("disabled", false);

    if (hijriDateOffset != 0) {
        $('#hijriDateOffset').removeClass('bg-light text-dark').addClass('bg-danger text-light');
        offsetPresent = true;
    }
    else {
        $('#hijriDateOffset').removeClass('bg-danger text-light').addClass('bg-light text-dark');
    }
    if (hijriDateOffset >= 2)
        $('#hijriDateIncrease').attr("disabled", true);

    if (hijriDateOffset <= -2)
        $('#hijriDateDecrease').attr("disabled", true);


    $('.offset-adjustments').hide();
    if (offsetPresent) {
        $('#offset-adjustments-red').show();
    }
    else {
        $('#offset-adjustments-blank').show();
    }
    if (offsetPresent) {
        $('#adhan-on').show();
    }
    else {
        $('#offset-adjustments-blank').show();
    }

    $('#adhanOffsetSettingsContent').html(aoContent);

}

const playAudio = (id) => {
    audioPlayer.src = '/adhans/' + id + '.mp3';
    audioPlayer.volume = appData.settings.volume / 10;
    $('.playAudioButton').attr('src', '/images/stop.png').addClass('bg-danger');
    audioPlayer.play();
    $('#audioPlayerDiv').show();
}

const stopAudio = () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    $('.playAudioButton').attr('src', '/images/play.png').removeClass('bg-danger');
    $('#audioPlayerDiv').hide();
}

audioPlayer.onended = () => {
    stopAudio();
}

const saveOffset = (name, action) => {
    chrome.storage.local.get(['appData'], function (result) {

        appData = result.appData;

        if (!appData.settings.vakitOffsets)
            appData.settings.vakitOffsets = {};

        let cv = appData.settings.vakitOffsets[name] ?? 0;

        if (action == '+')
            cv++;
        else
            cv--;
        appData.settings.vakitOffsets[name] = cv;
        chrome.storage.local.set({ 'appData': appData }, function () {
            goGoRun('offset update');
            $(':focus').blur();
            displayAdhansAndOffsets();
        });

    });
}

const saveHijriDateOffset = (action) => {

    chrome.storage.local.get(['appData'], function (result) {

        appData = result.appData;

        if (!appData.settings.hijriDateOffset)
            appData.settings.hijriDateOffset = 0;

        let cv = appData.settings.hijriDateOffset;

        if (action == '+')
            cv++;
        else
            cv--;

        appData.settings.hijriDateOffset = cv;

        chrome.storage.local.set({ 'appData': appData }, function () {
            goGoRun('hijri date offset updated');
            $(':focus').blur();
            displayAdhansAndOffsets();
        });

    });

}

const addressSearchFail = () => {
    $('#addressButton').attr('disabled', false);
    $('#address').val(appData.settings.address);
    $(':focus').blur();
    hideLoadingOnError();
}

const showLoading = () => {
    $('#loadingImg').attr('src', '/images/loading.png');
    $('#loading').show();
}

const hideLoadingOnSuccess = () => {
    $('#loadingImg').attr('src', '/images/check.png');
    setTimeout(() => { $('#loading').hide() }, 500);
}

const hideLoadingOnError = () => {
    $('#loadingImg').attr('src', '/images/x.png');
    setTimeout(() => { $('#loading').hide() }, 500);
}
