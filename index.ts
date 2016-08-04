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

import * as ko from 'knockout';
import * as promise from 'es6-promise';

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
export interface ScrollableValue<T> extends ko.Subscribable<T> {
    /** The method to call when the element is on screen */
    loadNext();
}

export var handler:ko.BindingHandler = {
    init: function (element: HTMLElement, valueAccessor: () => ScrollableValue<any>, allBindingsAccessor) {
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


export interface RequestParameters {
    offset?: number;
    limit?: number;
}

/**
 * The options for a SearchArray
 */
export interface Options<T, TU extends RequestParameters> {
    /**
     * A method that is called to fetch more rows
     * @param parameters The parameters for the request
     * @returns {} A promise for the new rows
     */
    request: (parameters: TU) => promise.Promise<T[]>;

    parameters: TU;
}

/**
 * A KnockoutObservableArray with methods to request more data
 */
export interface ScrollableArray<T, TU extends RequestParameters, TOptions extends Options<T, TU>> extends ko.ObservableArray<T> {
    options: TOptions;
    
    setOptions(options: TOptions);

    refresh: () => promise.Promise<T[]>;

    updating: ko.Observable<boolean>
    done: ko.Observable<boolean>

    loadNext();
}

/**
 * Creates an observable array with the SearchArray extensions
 * @param options The options for the SearchArray
 * @param value The initial values
 */
export function scrollableArray<T, TU extends RequestParameters>(options: Options<T, TU>, value?: T[]) {
    return <ScrollableArray<T, TU, Options<T, TU>>>ko.observableArray(value).extend({ scrollableArray: options });
}

/**
 * Describes an extension to an observable array that adds a method to load more data
 * @param target The observable that is extended
 * @param options The options
 */
export function scrollableArrayExtension<T, TU extends RequestParameters>(target: ScrollableArray<T, TU, Options<T, TU>>, options: Options<T, TU>) {
    target.updating = ko.observable(false);
    target.done = ko.observable(false);
    target.setOptions = newOptions => {
        target.options = newOptions;

        function load(empty: boolean) {
            target.options.parameters.offset = empty ? 0 : target().length;
            return newOptions.request(target.options.parameters).then(values => {
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
            }, () => {
                target.done(true);
                target.updating(false);
            });
        };

        target.refresh = () => {
            target.updating(true);
            target.done(false);
            return load(true);
        }

        target.loadNext = () => {
            if (target.updating() || target.done()) return;
            target.updating(true);
            load(false);
        }
    }
    target.setOptions(options);
};


export function register() {
    ko.bindingHandlers['infiniteScroll'] = handler;
    ko.extenders['scrollableArray'] = scrollableArrayExtension;
}