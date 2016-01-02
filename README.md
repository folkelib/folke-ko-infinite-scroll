# folke-ko-infinite-scroll
A TypeScript library for Knockout that calls a method while an element is on screen

## Usage

This is an AMD only library.

Register the binding:

    import * as infiniteScroll from 'infinite-scroll';
    
    infiniteScroll.register();
    
Use the binding:

    <div data-bind="infinite-scroll: rows"></div>
    
The rows variable must expose this method:

* loadNext: called when the element is on the viewport. Note that this method may be called very often, you should protect against that if the operation is asynchronous