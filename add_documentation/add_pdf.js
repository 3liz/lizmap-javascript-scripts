lizMap.events.on({
    uicreated: function(e) {
      lizMap.addDock(
            'pdf',
            'Aide',
            'right-dock',
            '<iframe src="....pdf" style="height:calc(100vh - 100px); height: -o-calc(100vh - 100px); height: -webkit-calc(100vh - 100px); height: -moz-calc(100vh - 100px);" width="100%" scrolling="no" frameborder="0"></iframe',
            'icon-file'
        );
        //-------------------------------------------
        //On ajoute le bouton1
        var html = '<button id="bouton1" class="btn btn-defaut">&#128279;- Plein écran</button>';
        $('#right-dock').append(html);
        $('#bouton1')
        .css('position', 'absolute')
        .css('top', '5px')
        .css('right', '60px')
        .css('padding', '1px 12px')
        ;
        //-------------------------------------------
        //On ajoute le bouton2
        var html = '<button id="bouton2" class="btn btn-warning"><i class="icon-refresh"></i></button>';
        $('#right-dock').append(html);
        $('#bouton2')
        .css('position', 'absolute')
        .css('top', '5px')
        .css('right', '5px')
        .css('padding', '1px 12px')
        ;
        //-------------------------------------------
        //On utilise le bouton1 pour ouvrir l'aide dans un nouvel onglet
        $('#bouton1').click(function () {
          window.open('....pdf');
        });
        //On utilise le bouton2 pour recharger le pdf
        $('#bouton2').click(function () {
          var iframe = $('<iframe src="....pdf" style="height:calc(100vh - 100px); height: -o-calc(100vh - 100px); height: -webkit-calc(100vh - 100px); height: -moz-calc(100vh - 100px);" width="100%" scrolling="no" frameborder="0"></iframe>');
          $(".menu-content").find("iframe").remove();
          $("#pdf.tab-pane.active .menu-content").append(iframe);
        });
      },

      rightdockopened: function(e) {
        if ( e.id == 'pdf') {
          $('#bouton1').css({
            'display':'block'
          });
          $('#bouton2').css({
            'display':'block'
          });
        }
        else {
          $('#bouton1').css({
            'display':'none'
          });
          $('#bouton2').css({
            'display':'none'
          });
        }
      }
});
