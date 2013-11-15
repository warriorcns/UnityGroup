#pragma strict

var wheelFL : WheelCollider;
var wheelFR : WheelCollider;
var wheelRL : WheelCollider;
var wheelRR : WheelCollider;

var wheelFLTrans : Transform;
var wheelFRTrans : Transform;
var wheelRLTrans : Transform;
var wheelRRTrans : Transform;

var minSpeed : float = -50;  //minimalna szybkość
var maxSpeed : float = 250;  //maksymalna szybkość
var speed : float;    //szybkość

private var friction : float;  //tarcie
private var forwardFrict : float;
private var slipFriction : float;
private var slipForwardFrict : float;

var lowSpeedSteerAngle : float = 10;
var highSpeedSteerAngle : float = 1;
var maxReverseSpeed : float = 50;
var decelleration : float = 30;   //zmniejszenie prędkości
var maxTorque : float = 50;  //maksymalny moment obrotowy
var breaking = 50;      //hamowanie
var braked : boolean = false;   //czy hamuje
var maxBrake : float = 100;    //maksymalna wartość hamowania

var wfc : WheelFrictionCurve;

var centerOfMass : Transform;

function Start(){
	//rigidbody.AddForce(-Physics.gravity);	
	rigidbody.centerOfMass = centerOfMass.localPosition;
	
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
		wheelRR.motorTorque = maxTorque * - 1.1; //ruch pojazdu 1.1 - skala
		wheelRL.motorTorque = maxTorque * - 1.1;
	}else{
		wheelRR.motorTorque = 0;
		wheelRL.motorTorque = 0;
	}
}

function SetWheelsAngle(){
	var speedFactor = rigidbody.velocity.magnitude/minSpeed;
	var currentAngle = Mathf.Lerp(lowSpeedSteerAngle, highSpeedSteerAngle, speedFactor);
	
	//currentAngle *= 30;   //skrecanie kol
	
	wheelFL.steerAngle = currentAngle;
	wheelFR.steerAngle = currentAngle;         //przekazywanie kąta
}

function BrakingCar(){
	/*if(Input.GetButton("Vertical") == false){       //hamowanie jeśli nie jedzie
		wheelRR.brakeTorque = decelleration;
		wheelRL.brakeTorque = decelleration;
	} else {
		wheelRR.brakeTorque = 0;        
		wheelRL.brakeTorque = 0;
	}*/
}

function Update(){		
	Rotate(wheelFLTrans, wheelFL);            //Obrót kół
	Rotate(wheelFRTrans, wheelFR);
	Rotate(wheelRLTrans, wheelRL);
	Rotate(wheelRRTrans, wheelRR);
	
	//obrót koła przy skręcaniu
	wheelFLTrans.localEulerAngles.y = -wheelFL.steerAngle - wheelFLTrans.localEulerAngles.z;   
	wheelFRTrans.localEulerAngles.y = -wheelFR.steerAngle - wheelFRTrans.localEulerAngles.z;
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