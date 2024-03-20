# Background selector

_(like on Google maps)_

The original base layer switcher is hidden by default when you use this script.
If you want show the base layer switcher, you can comment out the CSS part in background_selector.css this way :

```css
/*#switcher-baselayer{
    display:none;
}*/
```
`background_selector.css` may need to be updated according to the layout elements (overview enabled, atlas, themes, ...) by editing the `#content #baselayer-image-selector` rule

`background_selector-3-6.js` is dedicated for legacy LWC 3.6