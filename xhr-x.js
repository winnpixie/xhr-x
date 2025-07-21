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

    class XHRSetHeaderEvent extends XHREvent {
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

    class XHRDoneEvent extends XHREvent {
        constructor(context) {
            super(context);
        }
    }
    // END Event declarations

    const XHRExt = {
        onOpen: [],
        onSetHeader: [],
        onSend: [],
        onDone: []
    };
    
    window.XHRExt = XHRExt;

    // BEGIN Prototype overrides
    const xhr_open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.xMethod = arguments[0];
        this.xUrl = arguments[1];
        this.xAsync = arguments[2] || false;
        this.xUsername = arguments[3];
        this.xPassword = arguments[4];

        let preOpenEvent = new XHROpenEvent(this, "before");
        XHRExt.onOpen.forEach(handler => handler.call(null, preOpenEvent));
        if (preOpenEvent.cancelled) return;

        arguments[0] = this.xMethod;
        arguments[1] = this.xUrl;
        arguments[2] = this.xAsync;
        arguments[3] = this.xUsername;
        arguments[4] = this.xPassword;

        xhr_open.apply(this, arguments);
        XHRExt.onOpen.forEach(handler => handler.call(null, new XHROpenEvent(this, "after")));
    };

    const xhr_setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function () {
        if (this.xHeaders == null) this.xHeaders = [];

        this.xHeaders[arguments[0]] = arguments[1];

        let setHeaderEvent = new XHRSetHeaderEvent(this, arguments[0], arguments[1]);
        XHRExt.onSetHeader.forEach(handler => handler.call(null, setHeaderEvent));
        if (setHeaderEvent.cancelled) return;

        this.xHeaders[setHeaderEvent.key] = setHeaderEvent.value;
        arguments[0] = setHeaderEvent.key;
        arguments[1] = setHeaderEvent.value;

        xhr_setRequestHeader.apply(this, arguments);
    };

    const xhr_send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.xBody = arguments[0];

        let preSendEvent = new XHRSendEvent(this, "before");
        XHRExt.onSend.forEach(handler => handler.call(null, preSendEvent));
        if (preSendEvent.cancelled) return;

        arguments[0] = this.xBody;

        const xhr_onreadystatechange = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                XHRExt.onDone.forEach(handler => handler.call(null, new XHRDoneEvent(this)));
            }

            if (xhr_onreadystatechange != null) xhr_onreadystatechange.apply(this, arguments);
        };

        xhr_send.apply(this, arguments);
        XHRExt.onSend.forEach(handler => handler.call(null, new XHRSendEvent(this, "after")));
    };
    // END Prototype overrides
})();