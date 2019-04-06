lizMap.events.on({
    uicreated: function(e) {
      lizMap.addDock(
            'doc',
            'Documentation',
            'right-dock',
            '',
            'icon-book'
        );
        //-------------------------------------------
        $i = 0;
        $(function () {
          $('#mapmenu li.doc a').click(function () {
            if ($i === 0) {
              $i = 1;
              $('#right-dock-close').click();
              $('#mapmenu li.doc a').click();
              window.open('https://docs.lizmap.com/current/fr/index.html');
            } else {
              $i = 0;
            }
            });
          });
          //Pour aller plus loin il faudrait tester si l'atlas est ouvert ou si un autre right-dock existe
    }
});
