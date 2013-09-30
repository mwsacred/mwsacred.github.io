Ext.define('Mas.view.Viewport', {
	requires : [ 'Ext.layout.container.Border', 'Ext.tab.Panel' ],
	itemId : 'mainView',
	extend : 'Ext.container.Viewport',
	layout : 'border',
	items : [ {
		xtype : 'GlobalNav',
		region : 'north', // position for region
		height : 30

	}, {
		region : 'center', // center region is required, no width/height
		// specified
		xtype : 'tabpanel',
		layout : 'fit',
		tabPosition : 'bottom',
		itemId : 'mainTabpanel'
	} ]
});
