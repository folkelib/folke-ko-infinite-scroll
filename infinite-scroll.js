/*Copyright (C) 2015-2016 Sidoine De Wispelaere

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.*/
define(["require", "exports", 'knockout'], function (require, exports, ko) {
    "use strict";
    /** Checks if an element is in the viewport */
    function isElementInViewport(el) {
        var eap, rect = el.getBoundingClientRect(), docEl = document.documentElement, vWidth = window.innerWidth || docEl.clientWidth, vHeight = window.innerHeight || docEl.clientHeight, efp = function (x, y) { return document.elementFromPoint(x, y); }, contains = "contains" in el ? "contains" : "compareDocumentPosition", has = contains == "contains" ? 1 : 0x10;
        // Return false if it's not in the viewport
        if (rect.right < 0 || rect.bottom < 0
            || rect.left > vWidth || rect.top > vHeight)
            return false;
        // Return true if any of its four corners are visible
        return ((eap = efp(rect.left, rect.top)) == el || el[contains](eap) == has
            || (eap = efp(rect.right, rect.top)) == el || el[contains](eap) == has
            || (eap = efp(rect.right, rect.bottom)) == el || el[contains](eap) == has
            || (eap = efp(rect.left, rect.bottom)) == el || el[contains](eap) == has);
    }
    exports.handler = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var array = valueAccessor();
            var isInViewPort = false;
            var checkIsInViewPort = function () {
                var isInViewPortNow = isElementInViewport(element);
                if (isInViewPort != isInViewPortNow) {
                    isInViewPort = isInViewPortNow;
                    if (isInViewPortNow) {
                        array.loadNext();
                    }
                }
            };
            var ancestor = element.parentElement;
            var ancestors = new Array();
            while (ancestor != null && ancestor.style) {
                if (ancestor.style.overflowY == "auto") {
                    ancestors.push(ancestor);
                    ancestor.addEventListener('scroll', checkIsInViewPort);
                }
                ancestor = ancestor.parentElement;
            }
            checkIsInViewPort();
            document.addEventListener('ready', checkIsInViewPort);
            window.addEventListener('load', checkIsInViewPort);
            window.addEventListener('scroll', checkIsInViewPort);
            window.addEventListener('resize', checkIsInViewPort);
            var handle = array.subscribe(function (newValue) {
                // Force to refresh if still in view port (may not have any elements to push it out of the screen)
                isInViewPort = false;
                checkIsInViewPort();
            });
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                for (var _i = 0, ancestors_1 = ancestors; _i < ancestors_1.length; _i++) {
                    var ancestor = ancestors_1[_i];
                    ancestor.removeEventListener('scroll', checkIsInViewPort);
                }
                document.removeEventListener('ready', checkIsInViewPort);
                window.removeEventListener('load', checkIsInViewPort);
                window.removeEventListener('resize', checkIsInViewPort);
                window.removeEventListener('scroll', checkIsInViewPort);
                handle.dispose();
            });
        }
    };
    /**
     * Creates an observable array with the SearchArray extensions
     * @param options The options for the SearchArray
     * @param value The initial values
     */
    function scrollableArray(options, value) {
        return ko.observableArray(value).extend({ scrollableArray: options });
    }
    exports.scrollableArray = scrollableArray;
    /**
     * Describes an extension to an observable array that adds a method to load more data
     * @param target The observable that is extended
     * @param options The options
     */
    function scrollableArrayExtension(target, options) {
        target.updating = ko.observable(false);
        target.done = ko.observable(false);
        target.setOptions = function (newOptions) {
            target.options = newOptions;
            function load(empty) {
                target.options.parameters.offset = empty ? 0 : target().length;
                return newOptions.request(target.options.parameters).then(function (values) {
                    // Set to false before updating the value because somebody may listen to the array and would want to add more elements
                    target.updating(false);
                    if (values.length < options.parameters.limit) {
                        target.done(true);
                    }
                    if (empty) {
                        target(values);
                    }
                    else if (values.length > 0) {
                        ko.utils.arrayPushAll(target, values);
                    }
                    return values;
                }, function () {
                    target.done(true);
                    target.updating(false);
                });
            }
            ;
            target.refresh = function () {
                target.updating(true);
                target.done(false);
                return load(true);
            };
            target.loadNext = function () {
                if (target.updating() || target.done())
                    return;
                target.updating(true);
                load(false);
            };
        };
        target.setOptions(options);
    }
    exports.scrollableArrayExtension = scrollableArrayExtension;
    ;
    function register() {
        ko.bindingHandlers['infiniteScroll'] = exports.handler;
        ko.extenders['scrollableArray'] = scrollableArrayExtension;
    }
    exports.register = register;
});
