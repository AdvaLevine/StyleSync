import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import "../assets/styles/OutfitRecommendation.css";

const OutfitRecommendation = () => {
    const [step, setStep] = useState(1);

    // Form States
    const [weatherOption, setWeatherOption] = useState("");
    const [eventOption, setEventOption] = useState("");
    const [recommendationType, setRecommendationType] = useState("");

    const handleNext = () => setStep(step + 1);
    const handleRestart = () => {
        setStep(1);
        setWeatherOption("");
        setEventOption("");
        setRecommendationType("");
    };

    return (
        <div className='outfit-recommendation-container'>
            <Link to="/home" className="back-button">⟵</Link>
            {step === 1 && (
                <Form className='outfit-recommendation-box'>
                    <h1 className="mb-4">Outfit Recommendation</h1>
                    <Form.Group className="mb-3">
                        <Form.Label>How would you like to set the weather?</Form.Label>
                        <Form.Check
                            type="radio"
                            label="Choose manually"
                            name="weatherOption"
                            value="manual"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setWeatherOption(e.target.value)}
                            checked={weatherOption === "manual"}
                        />
                        <Form.Check
                            type="radio"
                            label="Set by time & Date (Using Real-Time weather API)"
                            name="weatherOption"
                            value="api"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setWeatherOption(e.target.value)}
                            checked={weatherOption === "api"}
                        />
                    </Form.Group>
                    <Button variant="primary" onClick={handleNext} disabled={!weatherOption}>
                        Next
                    </Button>
                </Form>
            )}

            {step === 2 && (
                <Form className='outfit-recommendation-box'>
                    <h1 className="mb-4">Outfit Recommendation</h1>
                    <Form.Group className="mb-3">
                        <Form.Label>How would you like to set your event?</Form.Label>
                        <Form.Check
                            type="radio"
                            label="Set manually"
                            name="eventOption"
                            value="manual"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setEventOption(e.target.value)}
                            checked={eventOption === "manual"}
                        />
                        <Form.Check
                            type="radio"
                            label="Set by time & date (Google Calendar API)"
                            name="eventOption"
                            value="calendar"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setEventOption(e.target.value)}
                            checked={eventOption === "calendar"}
                        />
                        <Form.Text className="text-muted">
                            * Requires connecting your Google Calendar in Settings
                        </Form.Text>
                    </Form.Group>
                    <Button variant="primary" onClick={handleNext} disabled={!eventOption}>
                        Next
                    </Button>
                </Form>
            )}

            {step === 3 && (
                <Form className='outfit-recommendation-box'>
                    <h1 className="mb-4">Outfit Recommendation</h1>

                    <Form.Group className="mb-3">
                        <Form.Label>How would you like to receive your recommendation?</Form.Label>
                        <Form.Check
                            type="radio"
                            label="By Text"
                            name="recommendationType"
                            value="text"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setRecommendationType(e.target.value)}
                            checked={recommendationType === "text"}
                        />
                        <Form.Check
                            type="radio"
                            label="By Photo"
                            name="recommendationType"
                            value="photo"
                            className='d-flex align-items-center gap-2'
                            onChange={(e) => setRecommendationType(e.target.value)}
                            checked={recommendationType === "photo"}
                        />
                    </Form.Group>
                    <div className="d-flex gap-2 ">
                        <Button variant="success" >
                            Get Recommendation
                        </Button>
                        <Button variant="secondary" onClick={handleRestart}>
                            Restart
                        </Button>
                    </div>
                </Form>
            )}
        </div>
    )
}
 
export default OutfitRecommendation;