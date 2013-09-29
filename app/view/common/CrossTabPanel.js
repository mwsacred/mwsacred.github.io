/**
 * TODO rowspan��� ������ rowSorting
 * TODO columnGroup��� ������ columnSorting or fieldSorting
 * TODO ������
 */
Ext.define('Mas.view.common.CrossTabPanel', {
        extend : 'Ext.grid.Panel',
        alias : 'widget.crosstab',

        // config
        /**
         * ������������ ������������ ��������� ��������� ������������ record��� ������
         */
        columnIndex: '',
        
        /**
         * ������������ ������������ ��������� ��� cell��� ������ ������������ field ������
         */
        dataIndex: '', // 
        
        /**
         * row��� ������������ record��� ������������ field
         */
        rowGroupIndex: '', 

        /**
         * private
         * 
         * ��������� column(row��� header ������)��� fieldName. 
         * rowGroupIndex��� ������ record������ rowHeaderIndices������ ��������� ��� ������ ������ ��������� ��� ���������.
         * ������ ������������ ��������� rowGroupIndex��� ������������ record��� ��������� ������.
         */
        rowHeaderIndices: [], 
        
        /**
         * column��� ��������� record��� ������ ��������� ��������� ������ ������������ ���
         */
        defaultValue: 0,
        
        /**
         * grouping ��������� ������ store
         */
        targetStore: null,
        
        /**
         * reconfigure��� ������������ ������ config ������
         */
        defaultColumns: null,
        
        constructor : function(config) {
                this.defaultColumns = this.columns || config.columns || [];
                this.callParent(arguments);
        },
        
        _reconfigure : function() {
                var me = this,
                        columns = [],
                        columnIndex = me.columnIndex,
                        dataIndex = me.dataIndex,
                        rowGroupIndex = me.rowGroupIndex,
                        rowHeaderIndices = me.rowHeaderIndices,
                        defaultValue = me.defaultValue;
        
                columns.push.apply(columns, me.defaultColumns);
                
                // rowHeaderIndices������
                for ( var i in columns) {
                        rowHeaderIndices.push(columns[i].dataIndex);
                }
                
                // ��������� column��� ������������ field������ ���������.
                // rowGroupIndex��� grouping��� record��� ��������� ��� store��� ���������������, 
                // cell��� ������������ ������ ��������� record��� raw ��������� ��������� ������������ ���������(��������� store��� field��� ��������� convert ��������� ������������).
                
                var fields = [],        // ��������� store��� fields
                        rows = []               // ��������� store��� data
                ;
                
                // rowHeaderIndices������ fields ���������
                for(var i in rowHeaderIndices) {
                        (function(rowHeaderIndex) { // closure ������
                                fields.push({
                                        name: rowHeaderIndex, 
                                        
                                        // ID0: model������ set��� ��������� ������ value������ ������ ��������������� ��������������� ��������� ���������.
                                        convert: function(value, record) {
                                                return record.raw[rowHeaderIndex]; 
                                        }
                                });
                        })(rowHeaderIndices[i]);
                }
                
                var tmpRowMap = {},     // ������������ ������������ fields��� ������������ ��������� ������ map
                        tmpFieldMap = {},       // grouping��� record��� ������������ ��������� ������ map
                        tmpRows = [],   // map.values()
                        tmpFields = [], // map.values()

                        getField = function(record, index) {
                                var ret = (index instanceof Function) ? index(record) : record.get(index);
                                return (ret instanceof Date) ? ret.getTime() : ret;
                        };
                
                // TODO column grouping��� ���������
                me.targetStore.each(function(o) {
                        var tmpRowKey = getField(o, rowGroupIndex);
                        var tmpData = tmpRowMap[tmpRowKey];
                        if(!tmpData) {
                                tmpData = {};
                                for(var i in rowHeaderIndices) {
                                        var rowHeaderIndex = rowHeaderIndices[i];
                                        tmpData[rowHeaderIndex] = o.get(rowHeaderIndex);
                                }
                                tmpRowMap[tmpRowKey] = tmpData;
                        }
                        
                        var fieldName = getField(o, columnIndex);
                        if(!tmpFieldMap.hasOwnProperty(fieldName)) {
                                tmpFieldMap[fieldName] = { 
                                        name: fieldName, // ID2
                                        
                                        // ID1: model������ set��� ��������� ������ value������ ������ ��������������� override��� ������������ set���������.
                                        convert: function(value, record) {
                                                var cell = record.raw[fieldName];
                                                return cell ? cell.get(dataIndex) : defaultValue;
                                        }
                                };
                        }
                        
                        tmpData[fieldName] = o; // grouping��� ��� record��� ������ record ������ 
                });
                
                for ( var i in tmpRowMap) {
                        var tmpRow = tmpRowMap[i];
                        tmpRows.push(tmpRow);
                }
                
                for ( var i in tmpFieldMap) {
                        var tmpField = tmpFieldMap[i];
                        tmpFields.push(tmpField);
                }
                
                // TODO tmpFields, tmpRows sorting
                
                for ( var i in tmpFields) {
                        columns.push(me.makeColumn(tmpFields[i]));
                }
                
                rows.push.apply(rows, tmpRows);
                fields.push.apply(fields, tmpFields);
                
                
                isModifying = false;
                var estore = new Ext.data.Store({
                        model: Ext.define('$$crosstab_model' + me.getId(), {
                                extend: 'Ext.data.Model', 
                                fields: fields,
                                
                                set:  function (fieldName, newValue) {
                                        isModifying = true;
                                        def: {
                                                for(var i in rowHeaderIndices)
                                                        if(fieldName === rowHeaderIndices[i])
                                                                break def;      // ������ ������ id: ID0, ID1
                                                
                                                var cell = this.raw[fieldName];
                                                // ������ ������ cell��� ������������ model��� ��������� targetStore��� add
                                                if(!cell) {
                                                        var newO = {};
                                                        
                                                        // XXX ��������� ������ ��� ������ ������ ������ ������. ��������� id column��� ��������� ��������������� ��������� ��� ������
                                                        for(var i in rowHeaderIndices)
                                                                newO[rowHeaderIndices[i]] = this.get(rowHeaderIndices[i]);
                                                        
                                                        cell = me.targetStore.add(newO)[0];
                                                        this.raw[fieldName] = cell;
                                                }
                                                cell.set(dataIndex, newValue); 
                                        }
                                        
                                        this.callParent(arguments);
                                        isModifying = false;
                                }
                        }),
                        data : rows,
                        
                        // estore��� ��������� ������ targetstore��� datachanged ������������ ������������ ������ reconfigure
                        targetStoreDataChangedListener: function(o) {
                                if(!isModifying)
                                        me._reconfigure();
                        }
                });
                
                var bulkremoveHandler = function(store, records, indexes) {
                        isModifying = true;
                        var targetRecords = [];
                        for ( var i in records) {
                                var record = records[i];
                                for ( var j in tmpFields) {
                                        var targetRecord = record.raw[tmpFields[j].name]; // ������ ������ id: ID2
                                        if(targetRecord)
                                                targetRecords.push(targetRecord);
                                }
                        }
                        
                        me.targetStore.remove(targetRecords);
                        isModifying = false;
                };
                
                estore.on('remove', function(store, record, index) {
                        bulkremoveHandler(store, [record], [index]);
                });
                estore.on('bulkremove', bulkremoveHandler);
                
                me.targetStore.un('datachanged', me.getStore().targetStoreDataChangedListener);
                me.reconfigure(estore, columns);
                me.targetStore.on('datachanged', me.getStore().targetStoreDataChangedListener);
        },
        
        makeColumn: function(field) {
                return {
                        xtype : 'numbercolumn',
                        dataIndex : field.name,
                        text : field.name
                };
        }
});