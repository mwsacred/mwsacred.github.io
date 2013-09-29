/**
 * TODO rowspan을 위한 rowSorting
 * TODO columnGroup을 위한 columnSorting or fieldSorting
 * TODO 소계
 */
Ext.define('Mas.view.common.CrossTabPanel', {
	extend : 'Ext.grid.Panel',
	alias : 'widget.crosstab',

	// config
	/**
	 * 동적으로 생성되는 컬럼의 이름을 결정하는 record의 필드
	 */
	columnIndex: '',
	
	/**
	 * 동적으로 생성되는 컬럼의 각 cell의 값을 리턴하는 field 이름
	 */
	dataIndex: '', // 
	
	/**
	 * row를 구성하는 record를 결정하는 field
	 */
	rowGroupIndex: '', 

	/**
	 * private
	 * 
	 * 고정된 column(row의 header 역할)의 fieldName. 
	 * rowGroupIndex가 같은 record들은 rowHeaderIndices에서 가져올 수 있는 값도 같아야 할 것이다.
	 * 현재 초기화는 새로운 rowGroupIndex에 해당하는 record의 값으로 한다.
	 */
	rowHeaderIndices: [], 
	
	/**
	 * column은 있으나 record가 없는 경우가 발생할 경우 보여주는 값
	 */
	defaultValue: 0,
	
	/**
	 * grouping 대상이 되는 store
	 */
	targetStore: null,
	
	/**
	 * reconfigure를 대비하여 처음 config 저장
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
		
		// rowHeaderIndices구성
		for ( var i in columns) {
			rowHeaderIndices.push(columns[i].dataIndex);
		}
		
		// 동적인 column에 해당하는 field들을 만든다.
		// rowGroupIndex로 grouping된 record로 구성된 새 store를 구성하는데, 
		// cell에 해당하는 값은 새로운 record의 raw 객체를 통해서 가져오는 값이다(새로운 store의 field는 무조건 convert 함수가 할당된다).
		
		var fields = [], 	// 새로운 store의 fields
			rows = [] 		// 새로운 store의 data
		;
		
		// rowHeaderIndices에서 fields 채우기
		for(var i in rowHeaderIndices) {
			(function(rowHeaderIndex) { // closure 생성
				fields.push({
					name: rowHeaderIndex, 
					
					// ID0: model에서 set을 호출할 경우 value에서 값을 가져오는데 무시하므로 수정이 안된다.
					convert: function(value, record) {
						return record.raw[rowHeaderIndex]; 
					}
				});
			})(rowHeaderIndices[i]);
		}
		
		var tmpRowMap = {},	// 동적으로 생성되는 fields를 중복없이 수집할 중간 map
			tmpFieldMap = {},	// grouping된 record를 중복없이 수집할 중간 map
			tmpRows = [],	// map.values()
			tmpFields = [],	// map.values()

			getField = function(record, index) {
				var ret = (index instanceof Function) ? index(record) : record.get(index);
				return (ret instanceof Date) ? ret.getTime() : ret;
			};
		
		// TODO column grouping도 필요함
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
					
					// ID1: model에서 set을 호출할 경우 value에서 값을 가져오는데 override한 함수에서 set해준다.
					convert: function(value, record) {
						var cell = record.raw[fieldName];
						return cell ? cell.get(dataIndex) : defaultValue;
					}
				};
			}
			
			tmpData[fieldName] = o; // grouping된 새 record에 예전 record 넣기 
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
								break def;	// 관련 주석 id: ID0, ID1
						
						var cell = this.raw[fieldName];
						// 없는 경우 cell에 해당하는 model을 만들어 targetStore에 add
						if(!cell) {
							var newO = {};
							
							// XXX 최대한 넣을 수 있는 공통 필드 설정. 현재는 id column이 있어야 실질적으로 동작할 수 있음
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
			
			// estore를 거치지 않고 targetstore의 datachanged 이벤트가 발생하면 다시 reconfigure
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
					var targetRecord = record.raw[tmpFields[j].name]; // 관련 주석 id: ID2
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
