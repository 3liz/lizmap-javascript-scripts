onmessage = function(event){
    const { dataJson } = event.data;
    postMessage({ dataJson });
}
