Ext.define('Mas.view.common.GlobalNav', {
	extend : 'Ext.toolbar.Toolbar',
	alias : 'widget.GlobalNav',

	store : this.store,

	initComponent : function() {
		var me = this;

		if (!me.store) {
			me.store = Ext.create('Mas.store.module.menu.Menus', {
				storeId : 'GNB-store'
			});
			me.store.load(function() {
				me.store.each(function(record) {
					if (record.get('children').length === 0) {
						me.createButton(record);
					} else {
						me.createMenu(record);
					}
				});
				me.add({
					xtype : 'tbfill'
				});
				me.add({
					xtype : 'label',
					text : Profile.userName + '님 환영합니다.'
				});
				me.add({
					text : '로그아웃',
					iconCls : 'icon-lock',
					listeners : {
						click : function() {
							window.location = 'logout';
						}
					}
				});
			});
		}

		me.callParent(arguments);
	},

	createButton : function(record) {
		var me = this;
		me.add({
			text : record.get('screenName'),
			screenClass : record.get('screenClass'),
			controllerClass : record.get('controllerClass'),
			screenId : record.get('screenId'),
			iconCls : record.get('iconClsName')
		});
	},

	createMenu : function(record) {
		var me = this;
		var menu = Ext.create('Ext.menu.Menu');

		Ext.Array.forEach(record.get('children'), function(sub) {
			menu.add({
				text : sub.screenName + '[' + sub.screenId + ']',
				screenClass : sub.screenClass,
				controllerClass : sub.controllerClass,
				screenId : sub.screenId,
				iconCls : sub.iconCls
			});
		});

		me.add({
			text : record.get('screenName'),
			screenClass : record.get('screenClass'),
			controllerClass : record.get('controllerClass'),
			screenId : record.get('screenId'),
			iconCls : record.get('iconClsName'),
			menu : menu
		});

	}

});
