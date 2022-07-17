(function () {
    'use strict';

    window.XHRX = {
        onBeforeOpen: [],
        onAfterOpen: [],
        onBeforeSend: [],
        onAfterSend: [],
        onCompleted: []
    };

    const xhr_open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.xMethod = arguments[0];
        this.xUrl = arguments[1];
        window.XHRX.onBeforeOpen.forEach(action => action(this));
        arguments[0] = this.xMethod;
        arguments[1] = this.xUrl;

        xhr_open.apply(this, arguments);
        window.XHRX.onAfterOpen.forEach(action => action(this));
    };

    const xhr_setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function () {
        if (this.xHeaders == null) this.xHeaders = [];

        this.xHeaders[arguments[0]] = arguments[1];
        xhr_setRequestHeader.apply(this, arguments);
    };

    const xhr_send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.xBody = arguments[0];
        window.XHRX.onBeforeSend.forEach(action => action(this));
        arguments[0] = this.xBody;

        const xhr_onreadystatechange = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                window.XHRX.onCompleted.forEach(action => action(this));
            }

            if (xhr_onreadystatechange != null) xhr_onreadystatechange.apply(this, arguments);
        };

        xhr_send.apply(this, arguments);
        window.XHRX.onAfterSend.forEach(action => action(this));
    };
})();