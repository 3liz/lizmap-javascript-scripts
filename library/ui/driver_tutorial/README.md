# Interactive Step-by-Step Guided Tours
![guided-tour](https://github.com/altheaFeu/lizmap-javascript-scripts/assets/123597411/4e2f95eb-28f5-4f11-b1c6-5db2901d1e05)
## Introduction

This script empowers you to craft a simple interactive guided tour using `shepherd.js`.

The initial popup design for the presentation draws inspiration from the metadata information popup available at:
[Popup Metadata Info](https://github.com/3liz/lizmap-javascript-scripts/blob/master/library/ui/popup_metadata_info).

You can use the provided CSS file to style your tour or customize the theme by modifying the default settings. If you prefer the original theme, update the initialization code as follows:
```javascript
const tour = new Shepherd.Tour({
        defaultStepOptions: {
            classes: 'shepherd-theme-default',
``` 

For detailed guidance and documentation on `shepherd.js`, refer to the official documentation at [shepherdjs.dev](https://shepherdjs.dev/).
