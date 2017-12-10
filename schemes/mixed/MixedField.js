import _ from 'lodash';
import React from 'react';
import Field from '../Field';
import CollapsedFieldLabel from '../../components/CollapsedFieldLabel';
import NestedFormField from '../../components/NestedFormField';

import {
	FormField,
	FormInput,
	FormNote,
	Grid,
	LabelledControl
} from '../../../admin/client/App/elemental';

module.exports = Field.create({

	displayName: 'MixedField',
	statics: {
		type: 'Mixed',
	},

	focusTargetRef: 'mixed1',

	handleLat (event) {
		const { value = [], path, onChange } = this.props;
		const newVal = event.target.value;
		onChange({
			path,
			value: [value[0], newVal],
		});
	},

	handleLong (event) {
		const { value = [], path, onChange } = this.props;
		const newVal = event.target.value;
		onChange({
			path,
			value: [newVal, value[1]],
		});
	},

	fieldChanged (fieldPath, event) {
		const { value = {}, path, onChange } = this.props;
		onChange({
			path,
			value: {
				...value,
				[fieldPath]: event.target.value,
			},
		});
	},

	makeChanger (fieldPath) {
		return this.fieldChanged.bind(this, fieldPath);
	},

	renderValue () {
		const { value } = this.props;
		if (value && value[1] && value[0]) {
			return <FormInput noedit>{value[1]}, {value[0]}</FormInput>; // eslint-disable-line comma-spacing
		}
		return <FormInput noedit>(not set)</FormInput>;
	},

	renderField (fieldPath, label, collapse, autoFocus) {
		const { value = {}, path } = this.props;
		return (
			<NestedFormField label={label} data-field-location-path={path + '.' + fieldPath}>
				<FormInput
					autoFocus={autoFocus}
					name={this.getInputName(path + '.' + fieldPath)}
					onChange={this.makeChanger(fieldPath)}
					placeholder={label}
					value={value[fieldPath] || ''}
				/>
			</NestedFormField>
		);
	},

	renderUI () {
		const { label = {}, path } = this.props;
		return (
			<div data-field-name={path} data-field-type="mixed">
				<FormField label={label} htmlFor={path} />
				{this.renderField('mixed1', 'Mixed 1', false, true)}
				{this.renderField('mixed2', 'Mixed 2')}
			</div>
		);
	},

});
