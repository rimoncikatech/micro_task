
## Objective

Set up a microservices application on AWS using ECS, managing infrastructure with
Terraform. The application will utilize IAM roles. Implement a CI/CD pipeline using
GitHub Actions for automated deployments.



## PROJECT URL: <br /> 

#Service-a  

#DNS: http://service-load-balancer-1748656751.ap-northeast-1.elb.amazonaws.com/  <br />
 
#Health Endpoint: http://service-load-balancer-1748656751.ap-northeast-1.elb.amazonaws.com/health  <br />


#Service-b

#DNS: http://service-b-load-balancer-16647868.ap-northeast-1.elb.amazonaws.com/ <br />

#Helath Endpoint: http://service-b-load-balancer-16647868.ap-northeast-1.elb.amazonaws.com/health <br />

<br /> <br /> 

## IAM role for ec2	
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
```

## VPC and Networking:
```
provider "aws" {
  region = "us-west-2"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "public-subnet-2"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "private-subnet-2"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_eip" "nat_eip" {
  vpc = true
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id

  tags = {
    Name = "main-nat"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "public-route-table"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "private-route-table"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private.id
}

```

## Terraform  Command: 

To create the VPC, 
* Export AWS credentials into environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
* Apply Terraform configuration:


```
terraform int
terrafom plan
terraform apply
```

## Deleting the VPC

To delete the VPC, 
* Export AWS credentials into environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
* Destroy Terraform configuration:
```bash
terraform destroy 
```


## ECR 

![alt text](https://github.com/rimoncikatech/micro_task/blob/main/images/Screenshot%202024-07-17%20at%208.36.25%E2%80%AFPM.png?raw=true)


## ECS Service: 

![alt text](https://github.com/rimoncikatech/micro_task/blob/main/images/Screenshot%202024-07-17%20at%208.36.44%E2%80%AFPM.png?raw=true)


## Load Balancer For ECS

![alt text](https://github.com/rimoncikatech/micro_task/blob/main/images/Screenshot%202024-07-17%20at%208.46.54%E2%80%AFPM.png?raw=true)


## Dockerfile


```
FROM --platform=linux/amd64 node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

## GitHub Actions CI/CD :

```
name: CICD

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v3
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: 'ap-northeast-1'

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR for Service A
        id: build-image-service-a
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: latest
          REPOSITORY: service-a
        run: |
          cd service-a
          docker buildx create --use
          docker buildx build --platform linux/amd64 -t $ECR_REGISTRY/$REPOSITORY:$IMAGE_TAG --push .

      - name: Build, tag, and push image to Amazon ECR for Service B
        id: build-image-service-b
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: latest
          REPOSITORY: service-b
        run: |
          cd service-b
          docker buildx create --use
          docker buildx build --platform linux/amd64 -t $ECR_REGISTRY/$REPOSITORY:$IMAGE_TAG --push .



      - name:  Check task definition output for Service A
        run: |
          echo "Task definition for Service A: ${{ steps.task-def-service-a.outputs.task-definition }}"
      - name: Deploy to ECS
        uses: imehedi/actions-awscli-v2@latest
        with:
          args: ecs update-service --cluster MicroCluster --service service-a --force-new-deployment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: "ap-northeast-1"



      - name:  Check task definition output for Service B
        run: |
         echo "Task definition for Service B: ${{ steps.task-def-service-b.outputs.task-definition }}"
      - name: Deploy to ECS
        uses: imehedi/actions-awscli-v2@latest
        with:
          args: ecs update-service --cluster MicroCluster --service service-b --force-new-deployment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: "ap-northeast-1"

```



