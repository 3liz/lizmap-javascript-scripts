lizMap.events.on({
 'uicreated':function(evt){
    var html = '';
    var title = 'My popup';
    var content = 'The content of the popup.'

    // Header
    html += '<div class="modal-header" style="background-color:rgba(0, 0, 0, 0.7);"><a class="close" data-dismiss="modal">X</a>';
    html += '<h3 style="color:white;">' + title + '</h3></div>';

    // Main content : body
    html += '<div class="modal-body">';
    html += '<p>' + content + '</p>';

    // Project Metadata
    html+= $('#metadata').html();

    // End of main content body
    html+= '</div>';

    // Footer
    html+= '<div class="modal-footer" style="background-color:rgba(0, 0, 0, 0.7);"><button type="button" class="btn btn-default" data-dismiss="modal">Ok</button></div>';

    $('#lizmap-modal').html(html);
    // Hide project image
    $('#lizmap-modal p:first,#lizmap-modal img.liz-project-img').hide();
    // Hide title label+content & description label
    $('#lizmap-modal dl.dl-vertical dt:first,#lizmap-modal dl.dl-vertical dd:first,#lizmap-modal dl.dl-vertical dt:nth-child(2)').hide();
    // Show modal
    $('#lizmap-modal').modal('show');
  }
});
