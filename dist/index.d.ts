import * as ko from 'knockout';
import * as promise from 'es6-promise';
/** The elements that expands indefinitely. The value that is binded
to the element must implements this interface. */
export interface ScrollableValue<T> extends ko.Subscribable<T> {
    /** The method to call when the element is on screen */
    loadNext(): any;
}
export declare var handler: ko.BindingHandler;
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
    setOptions(options: TOptions): any;
    refresh: () => promise.Promise<T[]>;
    updating: ko.Observable<boolean>;
    done: ko.Observable<boolean>;
    loadNext(): any;
}
/**
 * Creates an observable array with the SearchArray extensions
 * @param options The options for the SearchArray
 * @param value The initial values
 */
export declare function scrollableArray<T, TU extends RequestParameters>(options: Options<T, TU>, value?: T[]): ScrollableArray<T, TU, Options<T, TU>>;
/**
 * Describes an extension to an observable array that adds a method to load more data
 * @param target The observable that is extended
 * @param options The options
 */
export declare function scrollableArrayExtension<T, TU extends RequestParameters>(target: ScrollableArray<T, TU, Options<T, TU>>, options: Options<T, TU>): void;
export declare function register(): void;
