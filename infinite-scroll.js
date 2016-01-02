/*Copyright (C) 2015 Sidoine De Wispelaere

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
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                for (var _i = 0; _i < ancestors.length; _i++) {
                    var ancestor = ancestors[_i];
                    ancestor.removeEventListener('scroll', checkIsInViewPort);
                }
                document.removeEventListener('ready', checkIsInViewPort);
                window.removeEventListener('load', checkIsInViewPort);
                window.removeEventListener('resize', checkIsInViewPort);
                window.removeEventListener('scroll', checkIsInViewPort);
            });
        }
    };
    function register() {
        ko.bindingHandlers['infiniteScroll'] = exports.handler;
    }
    exports.register = register;
});
