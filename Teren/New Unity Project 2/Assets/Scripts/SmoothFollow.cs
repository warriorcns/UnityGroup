using UnityEngine;
using System.Collections;

public class SmoothFollow : MonoBehaviour 
{	
	public Transform target;
	public float distance = 10.0f;
	public float height = 5.0f;
	public float heightDamping = 2.0f;
	public float rotationDamping = 3.0f;
	
	private float wantedRotationAngle, wantedHeight;
	private float currentRotationAngle, currentHeight;
	
	void LateUpdate (){
		if (!target)
			return;

		wantedRotationAngle = target.eulerAngles.y;
		wantedHeight = target.position.y + height;
		
		currentRotationAngle = transform.eulerAngles.y;
		currentHeight = transform.position.y;

		currentRotationAngle = Mathf.LerpAngle (currentRotationAngle, wantedRotationAngle, rotationDamping * Time.deltaTime);

		currentHeight = Mathf.Lerp (currentHeight, wantedHeight, heightDamping * Time.deltaTime);

		Quaternion currentRotation = Quaternion.Euler(0, currentRotationAngle, 0);

		transform.position = target.position;
		transform.position -= currentRotation * Vector3.forward * distance;

		Vector3 newPos = transform.position;
		newPos.y = currentHeight;
		transform.position = newPos;

		transform.LookAt (target);
	}
}