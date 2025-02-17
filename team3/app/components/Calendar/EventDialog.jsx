import { useEffect, useRef, useState } from 'react';

const CustomButton = ({ onClick, children, style }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      backgroundColor: 'white',
      color: 'black',
      border: '1px solid white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.3s, color 0.3s',
      ...style
    }}
    onMouseOver={(e) => {
      e.target.style.backgroundColor = 'black';
      e.target.style.color = 'white';
    }}
    onMouseOut={(e) => {
      e.target.style.backgroundColor = 'white';
      e.target.style.color = 'black';
    }}
  >
    {children}
  </button>
);

function EventDialog({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(title);
    setTitle('');
    onClose();
  };

  return (
    <dialog 
      ref={dialogRef} 
      onClose={onClose}
      style={{
        border: '2px solid white',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: 'black',
        color: 'white',
        width: '300px',
        maxWidth: '100%'
      }}
    >
      <h2 style={{ marginTop: 0 }}>Create New Event</h2>
      <p>Enter a title for your new event.</p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '20px',
          borderRadius: '4px',
          border: '2px solid white',
          backgroundColor: 'black',
          color: 'white',
          fontWeight: 'bold'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <CustomButton onClick={handleSave}>Save</CustomButton>
        <CustomButton onClick={onClose}>Cancel</CustomButton>
      </div>
    </dialog>
  );
}

export default EventDialog;
