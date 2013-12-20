#pragma strict

var CorrespondingCollider : WheelCollider;
var skidMarkPrefab : GameObject;

function Start () {
	skidMarkPrefab.gameObject.active = false;
}

function Update () {
	var hit : RaycastHit;
	var ColliderCenterPoint : Vector3 = CorrespondingCollider.transform.TransformPoint(CorrespondingCollider.center);
	
	if(Physics.Raycast(ColliderCenterPoint, -CorrespondingCollider.transform.up, hit, CorrespondingCollider.suspensionDistance + CorrespondingCollider.radius))
	{
		transform.position = hit.point + (CorrespondingCollider.transform.up * CorrespondingCollider.radius);
	} 
	else
	{
		transform.position = ColliderCenterPoint - (CorrespondingCollider.transform.up * CorrespondingCollider.suspensionDistance);
	}
	
	var CorrespondingGroundHit : WheelHit;
	CorrespondingCollider.GetGroundHit(CorrespondingGroundHit);
	
	if(Mathf.Abs(CorrespondingGroundHit.sidewaysSlip) > 5.0)
	{
		skidMarkPrefab.gameObject.active = true;
	}
	else if(Mathf.Abs(CorrespondingGroundHit.sidewaysSlip) <= 4.75)
	{
		skidMarkPrefab.gameObject.active = false;
	}
}