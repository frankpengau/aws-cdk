import { Construct } from 'constructs';
import * as iam from '../../aws-iam';
import * as lambda from '../../aws-lambda';
import * as s3 from '../../aws-s3';
import { CfnResource, Names, Stack } from '../../core';

/**
 * Use a Lambda function as a bucket notification destination
 */
export class LambdaDestination implements s3.IBucketNotificationDestination {
  constructor(private readonly fn: lambda.IFunction) {
  }

  public bind(_scope: Construct, bucket: s3.ICfnBucket): s3.BucketNotificationDestinationConfig {
    const permissionId = `AllowBucketNotificationsTo${Names.nodeUniqueId(this.fn.permissionsNode)}`;

    if (!(bucket instanceof Construct)) {
      throw new Error(`LambdaDestination for function ${Names.nodeUniqueId(this.fn.permissionsNode)} can only be configured on a
        bucket construct (Bucket ${bucket.attrBucketName})`);
    }

    if (bucket.node.tryFindChild(permissionId) === undefined) {
      this.fn.addPermission(permissionId, {
        sourceAccount: Stack.of(bucket).account,
        principal: new iam.ServicePrincipal('s3.amazonaws.com'),
        sourceArn: bucket.attrArn,
        // Placing the permissions node in the same scope as the s3 bucket.
        // Otherwise, there is a circular dependency when the s3 bucket
        // and lambda functions declared in different stacks.
        scope: bucket,
      });
    }

    // if we have a permission resource for this relationship, add it as a dependency
    // to the bucket notifications resource, so it will be created first.
    const permission = bucket.node.tryFindChild(permissionId) as CfnResource | undefined;

    return {
      type: s3.BucketNotificationDestinationType.LAMBDA,
      arn: this.fn.functionArn,
      dependencies: permission ? [permission] : undefined,
    };
  }
}
