import React, { useState } from "react";
import "../../assets/styles/CreateWardrobe.css";  

const CreateWardrobe = () => {
    const [name, setName] = useState();
    const [numOfDoors, setNumOfDoors] = useState(0);
    const [doorNum, setDoorNum] = useState(0);
    const [numOfShelves, setNumOfShelves] = useState();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
    }

    return (
        <div className="create-wardrobe-container">
            <div className="create-wardrobe-box">
                <h2>Create Wardrobe</h2>
                <form onSubmit={handleSubmit}>
                    <label>Choose Wardrobe Name</label>
                    <input type="text" placeholder="Enter wardrobe's name" required min="1" max="9" onChange={(e) => setName(e.target.value)}/>

                    <label>Choose Number of Doors</label>
                    <input type="text" placeholder="Number of Doors" required onChange={(e) => {
                        const value = Math.min(9, Math.max(1, Number(e.target.value)));
                        setNumOfDoors(value);
                    }}/>

                    <div className="form-floating">
                    <select
                        className="form-select"
                        id="floatingSelectGrid"
                        aria-label="Floating label select example"
                        value={doorNum}
                        onChange={(e) => setDoorNum(e.target.value)}
                    >
                        <option value="" disabled>Open this select menu</option>
                        {[...Array(Number(numOfDoors)).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                            {`Door ${i + 1}`}
                        </option>
                        ))}
                    </select>
                    <label htmlFor="floatingSelectGrid">For Door</label>
                    </div>

                    <label>Choose Number of Shelves</label>
                    <input type="text" placeholder="Number of Shelves" required onChange={(e) => setNumOfShelves(e.target.value)}/>

                    <button type="submit">Create</button>
                </form>
            </div>
        </div>
    );
}

export default CreateWardrobe;