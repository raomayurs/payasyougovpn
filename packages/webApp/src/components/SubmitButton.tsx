import React from 'react'

class SubmitButton extends React.Component<{name: string, isDisabled: boolean, submitHandler: (event: any) => any}> {

    render() {
        return (
            <button 
                name={this.props.name} 
                className="btn btn-secondary" 
                onClick={(event) =>  this.props.submitHandler(event)} 
                disabled={this.props.isDisabled}>
                    {this.props.name}
            </button>
        )
    }
}


export default SubmitButton;