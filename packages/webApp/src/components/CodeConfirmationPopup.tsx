import React from "react";
import Modal from "react-modal"
import SubmitButton from './SubmitButton'

export default (props: {handleSubmit: any, isButtonDisabled: boolean, code: string, onCodeChange: any, handleCodeSubmit: any, isCodeSubmitButtonDisabled: boolean, isSigningIn: boolean}) => {
    const [modalIsOpen,setIsOpen] = React.useState(false);
    const closeModal = () => {
        setIsOpen(false)
    };

    const submitButtonOnClickAction =  (event: any) => props.handleSubmit(event, setIsOpen)
    return (<div>
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Code Verification"

        >
            
          <form>
            Please enter verification code: <input type="text" name="code" value={props.code} onChange={props.onCodeChange}/>
          </form>
          <button onClick={closeModal}>close</button>
          <button onClick={() => {props.handleCodeSubmit(closeModal)}} disabled={props.isCodeSubmitButtonDisabled}>Submit</button>
          {
            props.isSigningIn
                ?<div>Signing In...</div>
                : null
          }
        </Modal>
        <SubmitButton 
            name="Submit"
            submitHandler={submitButtonOnClickAction}
            isDisabled={props.isButtonDisabled} />
    </div>
    )
        
};