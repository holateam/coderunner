
```
**API answer format**
```
	Answer code : 200 (request accepted) / 400 (request rejected by queue limts)
	body :
	{
		dockerError: "",
		compilerErrors: "",
		stdout : [ "testcase1 otp", "testcase2 otp" ],
		stderr : [ "testcase1 err", "testcase2 err" ],
		timestamps : [ "testcase1 duration", "testcase2 duration" ]
	}
```
