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

import ko = require('knockout');

/** Checks if an element is in the viewport */
function isElementInViewport(el: HTMLElement) {
    var eap,
        rect = el.getBoundingClientRect(),
        docEl = document.documentElement,
        vWidth = window.innerWidth || docEl.clientWidth,
        vHeight = window.innerHeight || docEl.clientHeight,
        efp = (x: number, y: number) => document.elementFromPoint(x, y),
        contains = "contains" in el ? "contains" : "compareDocumentPosition",
        has = contains == "contains" ? 1 : 0x10;

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0
        || rect.left > vWidth || rect.top > vHeight)
        return false;

    console.log(`${rect.left}, ${rect.top}`);

    // Return true if any of its four corners are visible
    return (
        (eap = efp(rect.left, rect.top)) == el || el[contains](eap) == has
        || (eap = efp(rect.right, rect.top)) == el || el[contains](eap) == has
        || (eap = efp(rect.right, rect.bottom)) == el || el[contains](eap) == has
        || (eap = efp(rect.left, rect.bottom)) == el || el[contains](eap) == has
        );
}

/** The elements that expands indefinitely. The value that is binded
to the element must implements this interface. */
export interface ScrollableValue<T> extends KnockoutSubscribable<T> {
    /** The method to call when the element is on screen */
    loadNext();
}

export var handler:KnockoutBindingHandler = {
    init: function (element: HTMLElement, valueAccessor: () => ScrollableValue<any>, allBindingsAccessor) {
        var array = valueAccessor();
        
        var isInViewPort = false;

        var checkIsInViewPort = function () {
            var isInViewPortNow = isElementInViewport(element);
            console.log(`isInViewPort = ${isInViewPort}`);
            console.log(`isInViewPortNow = ${isInViewPortNow}`);
            if (isInViewPort != isInViewPortNow) {
                isInViewPort = isInViewPortNow;
                if (isInViewPortNow) {
                    console.log("loadNext");
                    array.loadNext();
                }
            }
        };
        
        var ancestor = element.parentElement;
        var ancestors = new Array<HTMLElement>();
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
        var handle = array.subscribe(newValue => {
            // Force to refresh if still in view port (may not have any elements to push it out of the screen)
            isInViewPort = false;
            checkIsInViewPort();
        });
        
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            for (var ancestor of ancestors) {
                ancestor.removeEventListener('scroll', checkIsInViewPort);
            }
            document.removeEventListener('ready', checkIsInViewPort);
            window.removeEventListener('load', checkIsInViewPort);
            window.removeEventListener('resize', checkIsInViewPort);
            window.removeEventListener('scroll', checkIsInViewPort);
            handle.dispose();
        });
    }
}

export function register() {
    ko.bindingHandlers['infiniteScroll'] = handler;
}