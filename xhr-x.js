(function () {
    'use strict';

    // BEGIN Event declarations
    class XHREvent {
        constructor(context) {
            this.context = context;

            this.cancelled = false;
        }
    }

    class XHROpenEvent extends XHREvent {
        constructor(context, state) {
            super(context);

            this.state = state;
        }
    }

    class XHRHeaderSetEvent extends XHREvent {
        constructor(context, key, value) {
            super(context);

            this.key = key;
            this.value = value;
        }
    }

    class XHRSendEvent extends XHREvent {
        constructor(context, state) {
            super(context);

            this.state = state;
        }
    }

    class XHRFinishedEvent extends XHREvent {
        constructor(context) {
            super(context);
        }
    }
    // END Event declarations

    const XHRExt = {
        openHandlers: [],
        headerSetHandlers: [],
        sendHandlers: [],
        finishHandlers: []
    };
    window.XHRExt = XHRExt;

    // BEGIN Prototype hacking
    const xhr_open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.xMethod = arguments[0];
        this.xUrl = arguments[1];
        this.xAsync = arguments[2] || false;
        this.xUsername = arguments[3];
        this.xPassword = arguments[4];

        let xhrEvent = new XHROpenEvent(this, "before");
        XHRExt.openHandlers.forEach(handler => handler.call(null, xhrEvent));
        if (xhrEvent.cancelled) return;

        arguments[0] = this.xMethod;
        arguments[1] = this.xUrl;
        arguments[2] = this.xAsync;
        arguments[3] = this.xUsername;
        arguments[4] = this.xPassword;

        xhr_open.apply(this, arguments);
        XHRExt.openHandlers.forEach(handler => handler.call(null, new XHROpenEvent(this, "after")));
    };

    const xhr_setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function () {
        if (this.xHeaders == null) this.xHeaders = [];

        this.xHeaders[arguments[0]] = arguments[1];

        let xhrEvent = new XHRHeaderSetEvent(this, arguments[0], arguments[1]);
        XHRExt.headerSetHandlers.forEach(handler => handler.call(null, xhrEvent));
        if (xhrEvent.cancelled) return;

        this.xHeaders[xhrEvent.key] = xhrEvent.value;
        arguments[0] = xhrEvent.key;
        arguments[1] = xhrEvent.value;

        xhr_setRequestHeader.apply(this, arguments);
    };

    const xhr_send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.xBody = arguments[0];

        let xhrEvent = new XHRSendEvent(this, "before");
        XHRExt.sendHandlers.forEach(handler => handler.call(null, xhrEvent));
        if (xhrEvent.cancelled) return;

        arguments[0] = this.xBody;

        const xhr_onreadystatechange = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                XHRExt.finishHandlers.forEach(handler => handler.call(null, new XHRFinishedEvent(this)));
            }

            if (xhr_onreadystatechange != null) xhr_onreadystatechange.apply(this, arguments);
        };

        xhr_send.apply(this, arguments);
        XHRExt.sendHandlers.forEach(handler => handler.call(null, new XHRSendEvent(this, "after")));
    };
    // END Prototype hacking
})();