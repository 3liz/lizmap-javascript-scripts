
# Group Time Tool

A LizMap custom JavaScript to display time series as a video or a GIF.
<img style="float: right;" src="/images/timetool500.png" alt="Logo" width="20"/>

## Requirements and install

The tool uses two JavaScript libraries to work:
* html2canvas (http://html2canvas.hertzen.com/), an API to capture the canvas of a DOM element.
* gif.js (https://jnordberg.github.io/gif.js/), a GIF encoder which has to be downloaded here. The files contained in the dist folder have to be place in a folder named gif.js-0.2.0.


The source code is available in the **src** folder while the images are disponible in the **images** folder. The tool is integrated in the LizMap project by following the below tree structure:

```bash
repositoryName/
    |__ projectName.qgs
    |__ projectName.qgs.cfg
    |__ media/
	    |__ images/
		    |__ timetool20.png
	    |__ js/
		    |__ projectName/
			    |__ grouptimetool.js
			    |__ timetool.html
		    |__ gif.js-0.2.0/
			    |__ gif.js
			    |__ gif.js.map
			    |__ gif.worker.js
			    |__ gif.worker.js.map
```

For more details, consult the documentation available [here](/doc/Group_time_tool.pdf?inline=false)

## Example

![](/doc/covid19-Deaths_FR.gif)

*Data source: OpenCOVID19-fr*

---

## Authors



## Licence
