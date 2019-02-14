lizMap.events.on({
	attributeLayerContentReady: function(e) {
		setTimeout(function(){
			var cleanLayerName = lizMap.cleanName(e.featureType);

			if( $('#attribute-layer-table-'+cleanLayerName+'_wrapper').data('filtersON') == undefined ){
				// Set flag to add filters only once
				$('#attribute-layer-table-'+cleanLayerName+'_wrapper').data('filtersON', true);

				$('#attribute-layer-table-'+cleanLayerName+'_wrapper thead:first th').not('.sorting_disabled').each( function () {
				    var title = $(this).text();
				    $(this).html( '<input type="text" placeholder=" '+title+'" />' );
				});

				var table = $('#attribute-layer-table-'+cleanLayerName).DataTable();

				table.columns().every( function () {
			       var column = this;

			       $( 'input', this.header() ).on( 'keyup change', function () {
			           if ( column.search() !== this.value ) {
			               column
			                   .search( this.value )
			                   .draw();
			           }
			       }).click(function(e) {
					   // We don't want to sort when users click on the search field
					   e.stopPropagation();
					});
			   	});
				lizMap.refreshDatatableSize("#attribute-layer-main-"+cleanLayerName);
			}
		}, 500);
	}
});