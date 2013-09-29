Ext.onReady(function() {
        // sample data
        
        var store = new Ext.data.Store({
                fields : [
                        { name: 'master.id' },
                        { name: 'master.name' },
                        { name: 'master.date' },
                        { name: 'id' },
                        { name: 'name' },
                        { name: 'value' }
                ],
                data : [
                        {master: {id: 1, name: 'master1_1', date: new Date(2013, 0, 1)}, id: 1, name: 'field1', value: 11},
                        {master: {id: 2, name: 'master2_2', date: new Date(2013, 1, 1)}, id: 2, name: 'field2', value: 22},
                        {master: {id: 2, name: 'master2_3', date: new Date(2013, 1, 1)}, id: 3, name: 'field3', value: 23},
                        {master: {id: 1, name: 'master1_4', date: new Date(2013, 0, 1)}, id: 4, name: 'field4', value: 14},
                ]
        });
                
        Ext.require('Mas.view.common.CrossTabPanel');
        
        var dd = Ext.create('Mas.view.common.CrossTabPanel', {
                renderTo: 'impl',
                layout: 'fit',
                
                title: '메롱',
                columns: [{
                        dataIndex : 'master.id',
                        text : 'MasterId',
                        align : 'center',
                        flex : 1
                }, {
                        dataIndex : 'master.name',
                        text : 'Name',
                        align : 'center',
                        flex : 1
                }],
                
                columnIndex: 'name',
                dataIndex: 'value', // 
//              rowGroupIndex: function(record) {
//                      var tmp = record.get('master.name');
//                      return tmp.substr(0, tmp.length-2);
//              }, 
//              rowGroupIndex: 'master.id', 
                rowGroupIndex: 'master.date', 
                defaultValue: 0,
                targetStore: store,
        });
        
        dd._reconfigure();
        
        dd.getStore().first().set('field1', 110);
        
        console.log(store.first().data);
        
        
        
        
        store.loadRawData([
                                {master: {id: 1, name: '2_master1_1', date: new Date(2013, 0, 1)}, id: 1, name: '2_field1', value: 11},
                                {master: {id: 2, name: '2_master2_2', date: new Date(2013, 1, 1)}, id: 2, name: '2_field2', value: 22},
                                {master: {id: 2, name: '2_master2_3', date: new Date(2013, 1, 1)}, id: 3, name: '2_field3', value: 23},
                                {master: {id: 1, name: '2_master1_4', date: new Date(2013, 0, 1)}, id: 4, name: '2_field4', value: 14},
                        ]);
        
        console.log(store.count());

        dd.getStore().remove(dd.getStore().first());
        
        console.log(store.count());
        
        dd.getStore().first().set('2_field1', 1100);
//      estore.add({});
        
        console.log(store.count());
        console.log(store.last());
        
});