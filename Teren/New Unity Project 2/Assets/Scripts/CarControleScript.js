#pragma strict

var wheelFL : WheelCollider;
var wheelFR : WheelCollider;
var wheelRL : WheelCollider;
var wheelRR : WheelCollider;

var wheelFLTrans : Transform;
var wheelFRTrans : Transform;
var wheelRLTrans : Transform;
var wheelRRTrans : Transform;

var minSpeed : float = 0;  //minimalna szybkość
var maxSpeed : float = 250;  //maksymalna szybkość
var speed : float;    //szybkość
var steerSpeed = 20;
var steer_max = 20;

private var friction : float;  //tarcie
private var forwardFrict : float;
private var slipFriction : float;
private var slipForwardFrict : float;
private var steer = 0;

var lowSpeedSteerAngle : float = 10;
var highSpeedSteerAngle : float = 1;
var maxReverseSpeed : float = 50;
var decelleration : float = 30;   //zmniejszenie prędkości
var maxTorque : float = 50;  //maksymalny moment obrotowy
var breaking = -100;      //hamowanie
var braked : boolean = false;   //czy hamuje
var maxBrake : float = -50;    //maksymalna wartość hamowania
var AntiRoll = 5000.0;
public var RotationValue : float = 0.0;

var wfc : WheelFrictionCurve;

var centerOfMass : Transform;

function Start(){
	//rigidbody.AddForce(-Physics.gravity);	
	rigidbody.centerOfMass = centerOfMass.localPosition;
	
	//var euler = wheel.localEulerAngles;
	
	//ustawianie tarcia bocznego i przedniego
	forwardFrict = wheelRR.forwardFriction.stiffness;   
	friction = wheelRR.sidewaysFriction.stiffness;
	slipForwardFrict = 0.003;
	slipFriction = 0.001;
	
	SetupWheelFrictionCurve();
}

function SetupWheelFrictionCurve()
{
	wfc = new WheelFrictionCurve();
	wfc.extremumSlip = 1;
    wfc.extremumValue = 50;
	wfc.asymptoteSlip = 2;
	wfc.asymptoteValue = 25;
	wfc.stiffness = 1;
}

function FixedUpdate(){
	Movement();	
	BrakingCar();	
	SetWheelsAngle();	
	HandBrake();
}

function Movement(){
	speed = 10 * wheelRL.radius * wheelRL.rpm * 60/1000;    //ustawianie prędkości
	speed = Mathf.Round(speed);
	
	if(speed > -maxSpeed && speed < maxReverseSpeed && !braked){       //ograniczenie prędkości
		wheelRR.motorTorque = maxTorque * - Input.GetAxis("Vertical"); //ruch pojazdu
		wheelRL.motorTorque = maxTorque * - Input.GetAxis("Vertical");
	}else{
		wheelRR.motorTorque = 0;
		wheelRL.motorTorque = 0;
	}
}

function SetWheelsAngle(){
	var speedFactor = rigidbody.velocity.magnitude/minSpeed;
	var currentAngle = Mathf.Lerp(lowSpeedSteerAngle, highSpeedSteerAngle, speedFactor);
	
	currentAngle *= Input.GetAxis("Horizontal");
	
	wheelFL.steerAngle = currentAngle;
	wheelFR.steerAngle = currentAngle;         //przekazywanie kąta
}

function BrakingCar(){
	if(Input.GetButton("Vertical") == false){       //hamowanie jeśli nie jedzie
		wheelRR.brakeTorque = decelleration;
		wheelRL.brakeTorque = decelleration;
	} else {
		wheelRR.brakeTorque = 0;        
		wheelRL.brakeTorque = 0;
	}
}

function Update(){		
	Rotate(wheelFLTrans, wheelFL);            //Obrót kół
	Rotate(wheelFRTrans, wheelFR);
	Rotate(wheelRLTrans, wheelRL);
	Rotate(wheelRRTrans, wheelRR);

	
	if ( steer == 0 && wheelFL.steerAngle != 0) {
 		if (Mathf.Abs(wheelFL.steerAngle) <= (steerSpeed * Time.deltaTime)) {
				wheelFL.steerAngle = 0;
			} else if (wheelFL.steerAngle > 0) {
				wheelFL.steerAngle = wheelFL.steerAngle - (steerSpeed * Time.deltaTime);
		 	} else {
				wheelFL.steerAngle = wheelFL.steerAngle + (steerSpeed * Time.deltaTime);
		 	}
	} 
   else {
		 wheelFL.steerAngle = wheelFL.steerAngle + (steer * steerSpeed * Time.deltaTime);
		  if (wheelFL.steerAngle > steer_max) { wheelFL.steerAngle = steer_max; }
		 if (wheelFL.steerAngle < -1 * steer_max) { wheelFL.steerAngle = -1 * steer_max; }
  	}  	
  	wheelFR.steerAngle = wheelFL.steerAngle;
	//obrót koła przy skręcaniu
	wheelFLTrans.localEulerAngles.z = wheelFL.steerAngle;   
	wheelFRTrans.localEulerAngles.z = wheelFR.steerAngle; //- wheelFRTrans.localEulerAngles.z;
	
	// update actual wheel localEulerAngles:
	//wheelFLTrans.localEulerAngles.z = wheelFLTrans.localEulerAngles.z;
	//wheelFRTrans.localEulerAngles.z = wheelFRTrans.localEulerAngles.z;
	
	//wheelFL.transform.rotation = wheelFL.transform.rotation * Quaternion.Euler( RotationValue, wheelFL.steerAngle, 0);
	//RotationValue += wheelFL.rpm * ( 360/60 ) * Time.deltaTime;
	
	var hit : WheelHit;
    var travelL = 1.0;
    var travelR = 1.0;

    var groundedL = wheelFL.GetGroundHit(hit);
    if (groundedL)
        travelL = (-wheelFL.transform.InverseTransformPoint(hit.point).y - wheelFL.radius) / wheelFL.suspensionDistance;

    var groundedR = wheelFR.GetGroundHit(hit);
    if (groundedR)
        travelR = (-wheelFR.transform.InverseTransformPoint(hit.point).y - wheelFR.radius) / wheelFR.suspensionDistance;

    var antiRollForce = (travelL - travelR) * AntiRoll;

    if (groundedL)
        rigidbody.AddForceAtPosition(wheelFL.transform.up * -antiRollForce,
               wheelFL.transform.position);	
    if (groundedR)
        rigidbody.AddForceAtPosition(wheelFR.transform.up * antiRollForce,
               wheelFR.transform.position);	
}

//Obrót danego koła
function Rotate(wheelTrans : Transform, wheel : WheelCollider){
	wheelTrans.Rotate(wheel.rpm/60 * 360 * Time.deltaTime, 0, 0);
}

//Hamulec ręczny - spacja
function HandBrake(){
	if(Input.GetButton("Jump")){
		braked = true;
	} else {
		braked = false;
	}
	
	if(braked){
	//hamowanie
		wheelRR.brakeTorque = maxBrake;        
		wheelRL.brakeTorque = maxBrake;
		wheelRR.motorTorque = 0;
		wheelRL.motorTorque = 0; 
		
		Friction(slipForwardFrict, slipFriction);
	} else {
		Friction(forwardFrict, friction);
	}
}

//Tarcie
function Friction(currentForwardFrict : float, currentFriction : float){
	wheelRR.forwardFriction.stiffness = currentForwardFrict;
	wheelRL.forwardFriction.stiffness = currentForwardFrict;
	wheelRR.sidewaysFriction.stiffness = currentFriction;
	wheelRL.sidewaysFriction.stiffness = currentFriction;
	//wheelFL.sidewaysFriction = wfc;
	//wheelFR.sidewaysFriction = wfc;
	//wheelRR.sidewaysFriction = wfc;
	//wheelRL.sidewaysFriction = wfc;
}


 


