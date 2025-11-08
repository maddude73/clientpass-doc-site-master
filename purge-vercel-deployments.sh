#!/bin/zsh

echo "Fetching deployments..."
echo "Latest deployment will be kept: $LATEST"
echo "Auto cleanup complete. Only the latest deployment remains."


# Get all deployment URLs from vercel ls output, skipping the header
#DEPLOYMENTS=($(vercel ls | awk '/https:\/\// {print $2}'))


echo "Loading deployments from deployment_urls.txt..."
# We assume deployment_urls.txt is in the same directory.
# The following echos were removed as they are duplicates
# of the final status message and $LATEST is not set here.

temp_file=$(mktemp) || exit 1
vercel ls  > $temp_file

# Load all deployment URLs from deployment_urls.txt into the DEPLOYMENTS array
# -t removes trailing newlines from each line
DEPLOYMENTS=( ${(f)"$(< $temp_file)"} )


if [[ ${#DEPLOYMENTS[@]} -eq 0 ]]; then
  echo "No deployments found."
  exit 1
fi

# Keep the first (latest) deployment, delete the rest
LATEST=${DEPLOYMENTS[0]}
echo "Latest deployment will be kept: $LATEST"

for url in "${DEPLOYMENTS[@]:1}"; do
  echo "Deleting deployment: $url"
  vercel remove $url --yes
done
rm "$temp_file"
echo "Auto cleanup complete. Only the latest deployment remains."
