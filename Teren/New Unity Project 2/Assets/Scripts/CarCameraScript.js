#pragma strict

var car : Transform;
var distance : float = 30;
var height : float = 5;
var rotationDamping : float = 14.0;   //czułość obrotu
var heightDamping : float = 0.5;
var zoomRatio : float = 0.5;
var DefaultFOV : float = 6;
var depth = 2.0;

private var rotationVector : Vector3;

function Start(){
}

function LateUpdate(){
	var wantedAngle = car.eulerAngles.y;          //ustawienie perspektywy
	var wantedHeight = car.position.y + height + 0.5;     //ustawienie wysokości kamery
	var wantedDepth = car.position.z + depth;
	var myAngleY = transform.eulerAngles.y;
	var myAngleZ = transform.eulerAngles.z;
	var myHeight = transform.position.y;
	var myDepth = transform.position.z;
	
	var localVelocity = car.InverseTransformDirection(car.rigidbody.velocity);
	
	if(localVelocity.z >- -0.5){            //obrót kamery jeśli jazda tyłem
		wantedAngle = car.eulerAngles.y;
	} else {
		wantedAngle = car.eulerAngles.y + 180;
	}
		
	myAngleY = Mathf.LerpAngle(myAngleY, wantedAngle, rotationDamping * Time.deltaTime);  //kąt wzgl. Y
	myAngleZ = Mathf.LerpAngle(myAngleZ, car.eulerAngles.z, rotationDamping * Time.deltaTime);  //kąt wzgl. Z
	myHeight = Mathf.Lerp(myHeight, wantedHeight, heightDamping * Time.deltaTime);  //wysokość
	myDepth =  Mathf.Lerp(myDepth, wantedDepth, heightDamping * Time.deltaTime);
		
	var currentRotation = Quaternion.Euler(0, myAngleY, 0);
		
	transform.position = car.position;                                    //poruszanie się kamery
	transform.position += currentRotation * Vector3.back * distance;
	transform.position.y = myHeight;
	transform.position.z = myDepth;
	transform.LookAt(new Vector3(car.position.x, car.position.y, car.position.z));
	//transform.LookAt(car);
}
