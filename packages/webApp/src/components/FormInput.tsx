import React, { ChangeEventHandler } from "react";
import { Dropdown } from "react-bootstrap";
import DateTimePicker from 'react-datetime-picker';

const FormTable = (props: {children: any}) => {
    return (
        <form>            
            {props.children}
        </form>
  )};

const DateRow = (props: {label: string, onChange: any, value:Date}) => {
    return (
        <div className="form-group row">
            <div className="col-sm-3">{props.label}</div>
            <div className="col-sm-7">
                <DateTimePicker
                    onChange={props.onChange}
                    value={props.value}
                />
            </div>
        </div>
    );
};
  
const TextRow = (props: {label: string, name: string, value: string, onChange: ChangeEventHandler<HTMLInputElement>, isInputInvalid: boolean, errorMessage: string}) => (
    <div className="form-group row">
        <label className="col-sm-3 col-form-label">{props.label}</label>
        <div className="col-sm-7">
            <input name={props.name} type={props.name === "password" ? "password": "text" } className="form-control"  value={props.value} onChange={props.onChange} />
            {
                props.isInputInvalid 
                    ? <div className="invalid-feedback" style={{display: 'block'}}>{props.errorMessage}</div>
                    : null
            }
        </div>        
    </div>
);

const DropdownRow = (props: {label: string, value: string, items: string[], onChange: ChangeEventHandler<HTMLSelectElement>}) => (
    <div className="form-group row">
        <label className="col-sm-3 col-form-label">{props.label}</label>
        <div className="col-sm-7">
            <select value={props.value} onChange={props.onChange}>
                {props.items.map((item) => (
                    <option value={item} key={item}>{item}</option>
                ))}
            </select>
        </div>        
    </div>
);

const RadioButtonRow = (props: {label: string, name: string, options: string[], stateVar: string, handleOptionChange: ChangeEventHandler<HTMLInputElement>}) => (  
    <fieldset className="form-group">
        <div className="row">
            <legend className="col-form-label col-sm-3 pt-0">{props.label}</legend>
            <div className="col-sm-7">
                { getRadioButtonOptions(props.options, props.name, props.stateVar, props.handleOptionChange)}                    
            </div>
        </div>
    </fieldset>
);

const getRadioButtonOptions = (options: string[], name: string, stateVar: string, handleOptionChange: ChangeEventHandler<HTMLInputElement>) => {
    return options.map((option)=> {
        return (
            <div key={option} className="form-check">                
                <input
                    type="radio"
                    className="form-check-input"
                    name={name}                    
                    onChange={handleOptionChange}
                    value={option}
                    checked={stateVar === option}
                />
                <label 
                    key={option} 
                    className="form-check-label"
                >
                    {option}
                </label> 
            </div>
        )
    });
};

export {
    FormTable,
    TextRow,
    RadioButtonRow,
    DateRow,
    DropdownRow
};